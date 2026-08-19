import { Link } from 'react-router-dom';

import { buttonVariants } from '@/components/ui/button';
import { formatKm, formatKzt, formatNumber, pluralRu } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Trip } from '@/api/types';

/**
 * Экономика рейса: «было / стало / сэкономлено». Три числа — это весь аргумент
 * проекта, поэтому сэкономленное выделено отдельным блоком, а не строкой в списке.
 */
export function TripSummary({ trip }: { trip: Trip }) {
  // Хаб в stopOrder дважды — выезд и возврат. Остановок ровно столько, сколько выгрузок.
  const stopsCount = Math.max(0, trip.stopOrder.length - 2);
  const savedPercent =
    trip.soloDistanceKm > 0
      ? Math.round((trip.savedDistanceKm / trip.soloDistanceKm) * 100)
      : 0;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 rounded-lg border bg-background/95 p-3 shadow-sm backdrop-blur duration-500">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">Рейс {trip.code}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatNumber(stopsCount)} {pluralRu(stopsCount, ['остановка', 'остановки', 'остановок'])}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-md border bg-muted/40 px-2.5 py-2">
          <dt className="text-xs text-muted-foreground">Было</dt>
          <dd className="text-lg font-semibold tabular-nums line-through decoration-muted-foreground/50">
            {formatKm(trip.soloDistanceKm)}
          </dd>
        </div>
        <div className="rounded-md border bg-muted/40 px-2.5 py-2">
          <dt className="text-xs text-muted-foreground">Стало</dt>
          <dd className="text-lg font-semibold tabular-nums">{formatKm(trip.totalDistanceKm)}</dd>
        </div>
      </dl>

      <div className="mt-2 rounded-md border border-emerald-500/50 bg-emerald-50/90 px-2.5 py-2 dark:bg-emerald-950/60">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-emerald-700 dark:text-emerald-400">Сэкономлено</span>
          <span className="text-xs font-medium text-emerald-700 tabular-nums dark:text-emerald-400">
            −{savedPercent}%
          </span>
        </div>
        <div className="text-xl font-semibold text-emerald-700 tabular-nums dark:text-emerald-400">
          {formatKzt(trip.savedCostKzt)}
        </div>
        <div className="text-xs text-emerald-700/80 tabular-nums dark:text-emerald-400/80">
          и {formatKm(trip.savedDistanceKm)} пробега
        </div>
      </div>

      {/* Ссылка, а не кнопка: это переход на роут, и средний клик должен открывать вкладку. */}
      <Link
        to="/report"
        className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'mt-3 w-full')}
      >
        Показать отчёт
      </Link>
    </div>
  );
}
