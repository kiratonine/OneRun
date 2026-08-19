import { useSettlements } from '@/api/queries';
import { MapView } from '@/map/MapView';
import { useSettlementMarkers } from '@/map/useSettlementMarkers';
import type { Settlement } from '@/api/types';

/** Слои карты живут отдельным компонентом — внутри провайдера, где карта уже есть. */
function MapLayers({ settlements }: { settlements: Settlement[] | undefined }) {
  useSettlementMarkers(settlements);
  return null;
}

export function MapPage() {
  const { data: settlements, isPending, isError, error } = useSettlements();

  return (
    <div className="relative h-full w-full">
      <MapView>
        <MapLayers settlements={settlements} />
      </MapView>

      {isPending && (
        <div className="absolute left-4 top-4 rounded-md border bg-background/90 px-3 py-2 text-sm shadow-sm">
          Загружаем справочник посёлков…
        </div>
      )}

      {isError && (
        <div className="absolute left-4 top-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Справочник не загрузился: {error.message}
        </div>
      )}

      {settlements && (
        <div className="absolute bottom-8 left-4 rounded-md border bg-background/90 px-3 py-2 text-sm shadow-sm">
          Населённых пунктов: <span className="font-medium">{settlements.length}</span>
        </div>
      )}
    </div>
  );
}
