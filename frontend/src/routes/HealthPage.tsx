import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { api } from '@/api/client';
import {
  API_BASE_URL,
  DEMO_ORDERS_COUNT,
  IS_REALTIME_CONFIGURED,
  USE_MOCK_API,
} from '@/config/constants';
import { useIsRealtimeLive } from '@/realtime/realtime-status';
import {
  checkOrders,
  checkPool,
  checkSettlements,
  checkTrip,
  type ContractIssue,
} from '@/features/health/contract';
import { cn } from '@/lib/utils';

interface ProbeResult {
  request: string;
  ok: boolean;
  ms: number;
  /** Короткий человеческий итог: сколько записей, какой код рейса. */
  note?: string;
  error?: string;
  issues: ContractIssue[];
}

async function probe(
  request: string,
  run: () => Promise<unknown>,
  check: (data: unknown) => ContractIssue[] = () => [],
  describe: (data: unknown) => string | undefined = () => undefined,
): Promise<{ result: ProbeResult; data: unknown }> {
  const startedAt = performance.now();
  try {
    const data = await run();
    return {
      data,
      result: {
        request,
        ok: true,
        ms: Math.round(performance.now() - startedAt),
        note: describe(data),
        issues: check(data),
      },
    };
  } catch (cause) {
    return {
      data: undefined,
      result: {
        request,
        ok: false,
        ms: Math.round(performance.now() - startedAt),
        // Сюда попадают и CORS, и 404, и упавший бэкенд — текст важнее классификации.
        error: cause instanceof Error ? cause.message : String(cause),
        issues: [],
      },
    };
  }
}

function ProbeRow({ result }: { result: ProbeResult }) {
  const errors = result.issues.filter((issue) => issue.severity === 'error');
  const infos = result.issues.filter((issue) => issue.severity === 'info');
  const isClean = result.ok && errors.length === 0;

  return (
    <div className="border-b px-4 py-3 last:border-0">
      <div className="flex items-baseline gap-3">
        <span
          className={cn(
            'size-2.5 shrink-0 translate-y-1 rounded-full',
            isClean ? 'bg-emerald-500' : result.ok ? 'bg-amber-500' : 'bg-destructive',
          )}
        />
        <code className="text-sm font-medium">{result.request}</code>
        <span className="text-xs text-muted-foreground tabular-nums">{result.ms} мс</span>
        {result.note && <span className="text-xs text-muted-foreground">{result.note}</span>}
      </div>

      {result.error && <p className="mt-1 pl-6 text-sm text-destructive">{result.error}</p>}

      {errors.map((issue) => (
        <p key={issue.path + issue.problem} className="mt-1 pl-6 text-sm text-destructive">
          <code>{issue.path}</code> — {issue.problem}
        </p>
      ))}

      {infos.map((issue) => (
        <p key={issue.path + issue.problem} className="mt-1 pl-6 text-sm text-muted-foreground">
          <code>{issue.path}</code> — {issue.problem}
        </p>
      ))}
    </div>
  );
}

/**
 * Диагностика бэкенда. Скрытый роут `/health`, в табах его нет.
 *
 * Смысл — стыковка под дедлайн: одна страница отвечает, отвечают ли ручки и в том ли
 * виде, вместо того чтобы искать причину пустого экрана по всему приложению.
 */
export function HealthPage() {
  const isRealtimeLive = useIsRealtimeLive();
  const [reads, setReads] = useState<ProbeResult[]>([]);
  // Страница открывается уже за работой — первый прогон стартует сам.
  const [isReading, setIsReading] = useState(true);
  const [flow, setFlow] = useState<ProbeResult[]>([]);
  const [isRunningFlow, setIsRunningFlow] = useState(false);

  /**
   * Результаты кладутся одним `setReads` в конце, а не по мере готовности: так в теле
   * эффекта нет синхронного состояния, а двойной вызов эффекта в StrictMode не удваивает
   * список — побеждает последний прогон по номеру.
   */
  const readRunRef = useRef(0);
  const runReads = useCallback(async () => {
    const runId = ++readRunRef.current;
    const results: ProbeResult[] = [];

    results.push(
      (
        await probe(
          'GET /api/settlements',
          api.getSettlements,
          checkSettlements,
          (data) => `${(data as unknown[]).length} посёлков`,
        )
      ).result,
    );
    results.push(
      (
        await probe(
          'GET /api/orders',
          api.getOrders,
          checkOrders,
          (data) => `${(data as unknown[]).length} заявок`,
        )
      ).result,
    );
    results.push(
      (
        await probe('GET /api/pool', api.getPool, checkPool, (data) => {
          const pool = data as { totalWeightKg?: number; thresholdKg?: number; isReady?: boolean };
          return `${pool.totalWeightKg} / ${pool.thresholdKg} кг, ${pool.isReady ? 'порог пройден' : 'порог не пройден'}`;
        })
      ).result,
    );

    if (readRunRef.current !== runId) return;
    setReads(results);
    setIsReading(false);
  }, []);

  useEffect(() => {
    void runReads();
  }, [runReads]);

  /** Полный сценарий демо от сброса до отчёта — то, что ломается на стыковке чаще всего. */
  const runFlow = useCallback(async () => {
    setIsRunningFlow(true);
    setFlow([]);

    const push = (result: ProbeResult) => setFlow((current) => [...current, result]);

    push((await probe('POST /api/demo/reset', api.resetDemo)).result);

    let seeded = 0;
    let firstSeed: ProbeResult | null = null;
    for (let i = 0; i < DEMO_ORDERS_COUNT; i += 1) {
      const { result, data } = await probe('POST /api/demo/seed', api.seedDemoOrder, (value) =>
        value === null ? [] : checkOrders([value]),
      );
      if (!firstSeed) firstSeed = result;
      if (!result.ok) {
        push(result);
        setIsRunningFlow(false);
        return;
      }
      if (data === null) break; // 204 — набор кончился
      seeded += 1;
    }

    if (firstSeed) {
      push({ ...firstSeed, request: `POST /api/demo/seed ×${DEMO_ORDERS_COUNT}`, note: `создано ${seeded}` });
    }

    const pool = await probe('GET /api/pool', api.getPool, checkPool, (data) => {
      const value = data as { isReady?: boolean; totalWeightKg?: number };
      return `${value.totalWeightKg} кг, ${value.isReady ? 'порог пройден' : 'порог НЕ пройден'}`;
    });
    if (pool.result.ok && !(pool.data as { isReady?: boolean }).isReady) {
      pool.result.issues = [
        ...pool.result.issues,
        {
          path: 'pool.isReady',
          problem: 'после полного набора порог не пройден — кнопка «Построить рейс» не появится',
          severity: 'error',
        },
      ];
    }
    push(pool.result);

    const created = await probe('POST /api/trips', api.createTrip, checkTrip, (data) => {
      const trip = data as { code?: string; totalDistanceKm?: number };
      return `${trip.code}, ${trip.totalDistanceKm} км`;
    });
    push(created.result);

    const tripId = (created.data as { id?: string } | undefined)?.id;
    if (tripId) {
      push(
        (
          await probe(
            `GET /api/trips/${tripId}`,
            () => api.getTrip(tripId),
            checkTrip,
            (data) => `отчёт ${(data as { report?: string }).report?.length ?? 0} символов`,
          )
        ).result,
      );
    }

    setIsRunningFlow(false);
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-xl font-semibold">Диагностика бэкенда</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Проверяет, что ручки отвечают и что поля совпадают с контрактом из{' '}
          <code>src/api/types.ts</code>. Страница служебная, в табах её нет.
        </p>

        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Адрес API</dt>
          <dd>
            <code>{API_BASE_URL}</code> {USE_MOCK_API && '— локальные фикстуры, сеть не задействована'}
          </dd>
          <dt className="text-muted-foreground">Realtime</dt>
          <dd>
            {!IS_REALTIME_CONFIGURED
              ? 'переменных нет — живость на опросе'
              : isRealtimeLive
                ? 'подписка активна'
                : 'настроен, но канал не поднялся — живость на опросе'}
          </dd>
        </dl>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Чтение</h2>
            <Button
              variant="outline"
              size="sm"
              disabled={isReading}
              onClick={() => {
                setIsReading(true);
                setReads([]);
                void runReads();
              }}
            >
              {isReading ? 'Проверяем…' : 'Проверить снова'}
            </Button>
          </div>
          <div className="mt-3 rounded-lg border">
            {reads.length === 0 && (
              <p className="px-4 py-3 text-sm text-muted-foreground">Опрашиваем ручки…</p>
            )}
            {reads.map((result) => (
              <ProbeRow key={result.request} result={result} />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Полный прогон</h2>
            <Button onClick={() => void runFlow()} disabled={isRunningFlow}>
              {isRunningFlow ? 'Прогоняем…' : 'Прогнать сценарий'}
            </Button>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Сброс → {DEMO_ORDERS_COUNT} заявок → пул → рейс → отчёт. Меняет данные на бэкенде:
            после прогона демо остаётся с построенным рейсом.
          </p>
          <div className="mt-3 rounded-lg border">
            {flow.length === 0 && (
              <p className="px-4 py-3 text-sm text-muted-foreground">Ещё не запускали.</p>
            )}
            {flow.map((result, index) => (
              <ProbeRow key={`${result.request}-${index}`} result={result} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
