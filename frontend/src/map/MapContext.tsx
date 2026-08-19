import { createContext, useContext } from 'react';
import type maplibregl from 'maplibre-gl';

interface MapContextValue {
  /** null, пока стиль не загрузился: до этого addSource/addLayer бросают. */
  map: maplibregl.Map | null;
}

const MapContext = createContext<MapContextValue>({ map: null });

export const MapProvider = MapContext.Provider;

/**
 * Карта, готовая к работе со слоями. Возвращает null, пока стиль грузится —
 * хуки-фичи должны выходить рано, а не ждать.
 */
export function useMap(): maplibregl.Map | null {
  return useContext(MapContext).map;
}
