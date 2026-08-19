import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useOrders } from '@/api/queries';
import { OrdersTable } from '@/features/orders/OrdersTable';
import { OrderModal } from '@/features/orders/OrderModal';
import { useCurrentTrip } from '@/features/trip/useCurrentTrip';
import { formatKg, formatNumber, pluralRu } from '@/lib/format';

export function OrdersPage() {
  const { data: orders, isPending, isError, error } = useOrders();
  const { trip } = useCurrentTrip();
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null);

  // Как и на карте: заявка берётся из кеша по коду, чтобы статус не устаревал.
  const selectedOrder = orders?.find((order) => order.code === selectedOrderCode) ?? null;
  const selectedTripLine =
    trip?.orders.find((line) => line.orderCode === selectedOrderCode) ?? null;

  const totalWeightKg = orders?.reduce((sum, order) => sum + order.weightKg, 0) ?? 0;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-xl font-medium">Заявки</h1>
          {orders && orders.length > 0 && (
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatNumber(orders.length)}{' '}
              {pluralRu(orders.length, ['заявка', 'заявки', 'заявок'])} · {formatKg(totalWeightKg)}
              {trip && ` · рейс ${trip.code}`}
            </p>
          )}
        </div>

        {isPending && <p className="mt-4 text-sm text-muted-foreground">Загружаем заявки…</p>}

        {isError && (
          <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Заявки не загрузились: {error.message}
          </p>
        )}

        {orders && orders.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            Пул пуст. Заявки появятся здесь, как только их создадут на{' '}
            <Link to="/" className="underline underline-offset-4">
              карте
            </Link>
            .
          </p>
        )}

        {orders && orders.length > 0 && (
          <div className="mt-4 rounded-lg border">
            <OrdersTable orders={orders} trip={trip} onSelectOrder={setSelectedOrderCode} />
          </div>
        )}
      </div>

      <OrderModal
        order={selectedOrder}
        tripLine={selectedTripLine}
        onClose={() => setSelectedOrderCode(null)}
      />
    </div>
  );
}
