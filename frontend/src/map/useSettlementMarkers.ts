import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';

import { MAP_FIT_MAX_ZOOM, MAP_FIT_PADDING_PX, MAP_LABEL_FONT } from '@/config/constants';
import type { Settlement } from '@/api/types';
import { useMap } from './MapContext';

const SOURCE_ID = 'settlements';
const CIRCLE_LAYER_ID = 'settlements-circle';
const LABEL_LAYER_ID = 'settlements-label';

/** Хаб выделяется размером и цветом — из него выходят все рейсы. */
const HUB_CODE = 'AKTAU';

function toFeatureCollection(settlements: Settlement[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: settlements.map((settlement) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [settlement.lon, settlement.lat], // [lon, lat] — порядок GeoJSON
      },
      properties: {
        code: settlement.code,
        nameRu: settlement.nameRu,
        isHub: settlement.code === HUB_CODE,
      },
    })),
  };
}

/**
 * Маркеры населённых пунктов с подписями. Один источник и два слоя на весь
 * справочник — круги и текст, а не маркер на каждую точку.
 */
export function useSettlementMarkers(settlements: Settlement[] | undefined) {
  const map = useMap();

  useEffect(() => {
    if (!map || !settlements?.length) return;

    const data = toFeatureCollection(settlements);
    const existing = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;

    if (existing) {
      existing.setData(data);
      return;
    }

    map.addSource(SOURCE_ID, { type: 'geojson', data });

    map.addLayer({
      id: CIRCLE_LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-radius': ['case', ['get', 'isHub'], 8, 5],
        'circle-color': ['case', ['get', 'isHub'], '#0f172a', '#ffffff'],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#0f172a',
      },
    });

    map.addLayer({
      id: LABEL_LAYER_ID,
      type: 'symbol',
      source: SOURCE_ID,
      layout: {
        'text-field': ['get', 'nameRu'],
        'text-font': MAP_LABEL_FONT,
        'text-size': ['case', ['get', 'isHub'], 14, 12],
        'text-offset': [0, 1.2],
        'text-anchor': 'top',
        'text-allow-overlap': false,
      },
      paint: {
        'text-color': '#0f172a',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.5,
      },
    });

    // Показать всю область целиком при первой загрузке справочника.
    const bounds = settlements.reduce(
      (acc, settlement) => acc.extend([settlement.lon, settlement.lat]),
      new maplibregl.LngLatBounds(
        [settlements[0].lon, settlements[0].lat],
        [settlements[0].lon, settlements[0].lat],
      ),
    );
    map.fitBounds(bounds, { padding: MAP_FIT_PADDING_PX, maxZoom: MAP_FIT_MAX_ZOOM });
  }, [map, settlements]);
}
