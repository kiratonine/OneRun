import { Link } from 'react-router-dom';

import { ReportView } from '@/features/report/ReportView';
import { useCurrentTrip } from '@/features/trip/useCurrentTrip';
import { Badge } from '@/components/ui/badge';
import { formatKm, formatKzt } from '@/lib/format';

const REPORT_SOURCE_LABELS = {
  gemini: 'Составлен ИИ',
  mock: 'Черновик',
} as const;

export function ReportPage() {
  const { trip, tripId, isPending } = useCurrentTrip();

  if (isPending) {
    return <p className="p-6 text-sm text-muted-foreground">Загружаем отчёт…</p>;
  }

  if (!trip) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-medium">Отчёт</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {tripId
            ? 'Рейс не найден — возможно, демо сбросили. '
            : 'Рейс ещё не построен. '}
          Соберите пул и нажмите «Построить рейс» на{' '}
          <Link to="/" className="underline underline-offset-4">
            карте
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Ширина по мерке текста: длинная строка на широком экране не читается. */}
      <article className="mx-auto max-w-3xl rounded-lg border bg-card p-8 shadow-sm">
        <header className="flex flex-wrap items-center gap-3 border-b pb-4">
          <h1 className="text-xl font-medium">Рейс {trip.code}</h1>
          <Badge variant="secondary">{REPORT_SOURCE_LABELS[trip.reportSource]}</Badge>
          <span className="ml-auto text-sm text-muted-foreground tabular-nums">
            {formatKm(trip.totalDistanceKm)} · экономия {formatKzt(trip.savedCostKzt)}
          </span>
        </header>

        <div className="text-sm text-foreground">
          <ReportView markdown={trip.report} />
        </div>
      </article>
    </div>
  );
}
