import { useEffect, useRef, useState, type ReactNode } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import {
  MAP_INITIAL_CENTER,
  MAP_INITIAL_ZOOM,
  MAP_STYLE_URL,
  mapNavigationOptions,
} from '@/config/constants';
import { MapProvider } from './MapContext';

interface MapViewProps {
  /** Хуки-фичи (маркеры, линии, маршрут) — рендерятся после загрузки стиля. */
  children?: ReactNode;
}

/**
 * Контейнер MapLibre. Инстанс создаётся один раз и живёт вне React-дерева:
 * обновление state не перерисовывает карту, слои меняются императивно.
 */
export function MapView({ children }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [styleError, setStyleError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const instance = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: MAP_INITIAL_CENTER,
      zoom: MAP_INITIAL_ZOOM,
      attributionControl: { compact: true },
    });
    mapRef.current = instance;

    instance.addControl(new maplibregl.NavigationControl(mapNavigationOptions), 'top-right');
    instance.on('load', () => setMap(instance));
    instance.on('error', (event) => {
      // Ошибки отдельных тайлов не критичны — ловим только падение стиля целиком.
      if (!instance.isStyleLoaded()) {
        setStyleError(event.error?.message ?? 'Не удалось загрузить стиль карты');
      }
    });

    return () => {
      instance.remove();
      mapRef.current = null;
      setMap(null);
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {styleError && (
        <div className="absolute inset-x-4 top-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Карта не загрузилась: {styleError}
        </div>
      )}

      <MapProvider value={{ map }}>{children}</MapProvider>
    </div>
  );
}
