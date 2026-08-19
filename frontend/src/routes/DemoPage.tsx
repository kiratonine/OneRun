import { Button } from '@/components/ui/button';
import { useDemoSeeder } from '@/features/demo/useDemoSeeder';
import { ResetButton } from '@/features/demo/ResetButton';
import { usePool } from '@/api/queries';
import { formatKg, formatNumber } from '@/lib/format';
import { USE_MOCK_API } from '@/config/constants';
import { cn } from '@/lib/utils';

/**
 * Пульт для телефона. Ни карты, ни таблиц: две кнопки во весь экран и счётчик.
 * Управляет им напарник во время питча, стоя, одной рукой, не глядя на экран.
 */
export function DemoPage() {
  const { sentCount, totalCount, isSeeding, isResetting, isExhausted, error, seedAll, reset } =
    useDemoSeeder();
  const { data: pool } = usePool();

  const isReady = pool?.isReady ?? false;

  return (
    <div className="flex min-h-svh flex-col gap-6 p-6">
      <header className="flex items-baseline justify-between gap-3">
        <span className="text-lg font-semibold">OneRun · демо</span>
        {USE_MOCK_API && (
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-700 dark:text-amber-400">
            мок-данные
          </span>
        )}
      </header>

      {/* Счётчик: крупная цифра плюс точки — на неё смотрят краем глаза. */}
      <div
        className={cn(
          'rounded-xl border p-5 transition-colors duration-500',
          isReady && 'border-emerald-500/60 bg-emerald-50/80 dark:bg-emerald-950/60',
        )}
      >
        <div className="text-sm text-muted-foreground">Отправлено заявок</div>
        <div
          className={cn(
            'mt-1 text-5xl font-semibold tabular-nums transition-colors duration-500',
            isReady && 'text-emerald-700 dark:text-emerald-400',
          )}
        >
          {formatNumber(sentCount)}
          <span className="ml-2 text-2xl font-normal text-muted-foreground">/ {totalCount}</span>
        </div>

        <div className="mt-4 flex gap-2">
          {Array.from({ length: totalCount }, (_, index) => (
            <span
              key={index}
              className={cn(
                'h-3 flex-1 rounded-full transition-colors duration-300',
                index < sentCount ? (isReady ? 'bg-emerald-500' : 'bg-foreground') : 'bg-muted',
              )}
            />
          ))}
        </div>

        {pool && (
          <div className="mt-4 text-sm text-muted-foreground tabular-nums">
            В пуле: {formatNumber(pool.totalWeightKg)} / {formatKg(pool.thresholdKg)}
            {pool.isReady && (
              <span className="ml-2 font-medium text-emerald-700 dark:text-emerald-400">
                порог пройден
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isExhausted && !error && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Демо-набор исчерпан. Нажмите «Сброс», чтобы прогнать сценарий заново.
        </div>
      )}

      {/* Кнопки прижаты к низу: большой палец достаёт до них, не перехватывая телефон. */}
      <div className="mt-auto flex flex-col gap-3">
        <Button
          size="lg"
          className="h-20 w-full text-xl"
          onClick={() => void seedAll()}
          disabled={isSeeding || isResetting}
        >
          {isSeeding ? `Создаём… ${sentCount} из ${totalCount}` : 'Создать заявки'}
        </Button>

        <ResetButton
          onReset={() => void reset()}
          isResetting={isResetting}
          className="h-16 w-full text-lg"
        />
      </div>
    </div>
  );
}
