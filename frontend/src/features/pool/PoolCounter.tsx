import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatKg, formatNumber, pluralRu } from '@/lib/format';
import type { PoolStatus } from '@/api/types';

interface PoolCounterProps {
  pool: PoolStatus | undefined;
  onBuildTrip?: () => void;
  isBuilding?: boolean;
  /** Рейс уже построен: кнопку сменяет панель экономики, её рисует страница. */
  hasTrip?: boolean;
}

/**
 * Счётчик пула. Переход через порог — кульминация демо, поэтому панель
 * меняет цвет целиком, а кнопка не просто появляется, а въезжает снизу.
 */
export function PoolCounter({ pool, onBuildTrip, isBuilding, hasTrip }: PoolCounterProps) {
  if (!pool) {
    return (
      <div className="w-full rounded-lg border bg-background/95 p-3 text-sm text-muted-foreground shadow-sm backdrop-blur">
        Считаем пул…
      </div>
    );
  }

  const { totalWeightKg, ordersCount, thresholdKg, isReady } = pool;
  const percent = thresholdKg > 0 ? Math.min(100, (totalWeightKg / thresholdKg) * 100) : 0;
  const remainingKg = Math.max(0, thresholdKg - totalWeightKg);

  return (
    <div
      className={cn(
        'w-full rounded-lg border bg-background/95 p-3 shadow-sm backdrop-blur transition-colors duration-500',
        isReady && 'border-emerald-500/60 bg-emerald-50/95 dark:bg-emerald-950/80',
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">Пул заявок</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatNumber(ordersCount)} {pluralRu(ordersCount, ['заявка', 'заявки', 'заявок'])}
        </span>
      </div>

      <div
        className={cn(
          'mt-1 text-2xl font-semibold tabular-nums transition-colors duration-500',
          isReady && 'text-emerald-700 dark:text-emerald-400',
        )}
      >
        {formatNumber(totalWeightKg)}
        <span className="ml-1 text-base font-normal text-muted-foreground">
          / {formatKg(thresholdKg)}
        </span>
      </div>

      {/* Индикатор красится через data-slot: своего пропса для него у Progress нет. */}
      <Progress
        value={percent}
        aria-label="Заполнение пула до порога"
        className={cn(
          'mt-2',
          isReady && '**:data-[slot=progress-indicator]:bg-emerald-500',
        )}
      />

      <p
        className={cn(
          'mt-2 text-xs',
          isReady ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground',
        )}
      >
        {isReady
          ? 'Порог пройден — машину можно отправлять'
          : `До порога ещё ${formatKg(remainingKg)}`}
      </p>

      {isReady && !hasTrip && (
        <Button
          size="lg"
          className="mt-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-500"
          onClick={onBuildTrip}
          disabled={isBuilding || !onBuildTrip}
        >
          {isBuilding ? 'Строим рейс…' : 'Построить рейс'}
        </Button>
      )}
    </div>
  );
}
