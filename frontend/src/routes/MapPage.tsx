import { useState } from 'react';

import { useCreateTrip, useOrders, usePool, useSettlements } from '@/api/queries';
import { MapView } from '@/map/MapView';
import { useSettlementMarkers } from '@/map/useSettlementMarkers';
import { useBaseLabelFilter } from '@/map/useBaseLabelFilter';
import { useOrderLines } from '@/map/useOrderLines';
import { useRouteLine } from '@/map/useRouteLine';
import { OrderModal } from '@/features/orders/OrderModal';
import { PoolCounter } from '@/features/pool/PoolCounter';
import { TripSummary } from '@/features/trip/TripSummary';
import { useCurrentTrip } from '@/features/trip/useCurrentTrip';
import type { Order, Settlement, Trip } from '@/api/types';

interface MapLayersProps {
  settlements: Settlement[] | undefined;
  orders: Order[] | undefined;
  trip: Trip | undefined;
  selectedOrderCode: string | null;
  onSelectOrder: (orderCode: string) => void;
}

/** Слои карты живут отдельным компонентом — внутри провайдера, где карта уже есть. */
function MapLayers({ settlements, orders, trip, selectedOrderCode, onSelectOrder }: MapLayersProps) {
  useBaseLabelFilter(settlements);
  useSettlementMarkers(settlements);
  useOrderLines(orders, { selectedOrderCode, onSelectOrder, isDimmed: Boolean(trip) });
  useRouteLine(trip, settlements);
  return null;
}

export function MapPage() {
  const { data: settlements, isPending, isError, error } = useSettlements();
  const { data: orders } = useOrders();
  const { data: pool } = usePool();
  const { trip, setTripId } = useCurrentTrip();
  const createTrip = useCreateTrip();

  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null);

  // Заявка ищется в свежем кеше, а не хранится в state: после построения рейса
  // у неё меняется статус, и копия в state показывала бы устаревшие данные.
  const selectedOrder = orders?.find((order) => order.code === selectedOrderCode) ?? null;
  const selectedTripLine =
    trip?.orders.find((line) => line.orderCode === selectedOrderCode) ?? null;

  return (
    <div className="relative h-full w-full">
      <MapView>
        <MapLayers
          settlements={settlements}
          orders={orders}
          trip={trip}
          selectedOrderCode={selectedOrderCode}
          onSelectOrder={setSelectedOrderCode}
        />
      </MapView>

      {/* Колонка оверлеев не перехватывает драг карты — клики ловят только сами панели. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex w-80 flex-col gap-3 overflow-y-auto p-4">
        <div className="pointer-events-auto">
          <PoolCounter
            pool={pool}
            // id рейса поднимается в общее состояние: его ждут вкладки «Заявки» и «Отчёт».
            onBuildTrip={() => createTrip.mutate(undefined, { onSuccess: (t) => setTripId(t.id) })}
            isBuilding={createTrip.isPending}
            hasTrip={Boolean(trip)}
          />
        </div>

        {trip && (
          <div className="pointer-events-auto">
            <TripSummary trip={trip} />
          </div>
        )}

        {isPending && (
          <div className="pointer-events-auto rounded-md border bg-background/90 px-3 py-2 text-sm shadow-sm">
            Загружаем справочник посёлков…
          </div>
        )}

        {isError && (
          <div className="pointer-events-auto rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Справочник не загрузился: {error.message}
          </div>
        )}

        {createTrip.isError && (
          <div className="pointer-events-auto rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Рейс не построился: {createTrip.error.message}
          </div>
        )}

        {settlements && (
          <div className="pointer-events-auto mt-auto w-fit rounded-md border bg-background/90 px-3 py-2 text-sm shadow-sm">
            Населённых пунктов: <span className="font-medium">{settlements.length}</span>
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
