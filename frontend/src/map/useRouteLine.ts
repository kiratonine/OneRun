import { useEffect } from 'react';
import type maplibregl from 'maplibre-gl';
import type { Feature, FeatureCollection } from 'geojson';

import {
  MAP_LABEL_FONT,
  ROUTE_LINE_CASING_COLOR,
  ROUTE_LINE_CASING_WIDTH,
  ROUTE_LINE_COLOR,
  ROUTE_LINE_OPACITY,
  ROUTE_LINE_WIDTH,
  TRIP_STOP_CIRCLE_RADIUS,
  TRIP_STOP_LABEL_SIZE,
} from '@/config/constants';
import type { Settlement, Trip } from '@/api/types';
import { useMap } from './MapContext';
import { SETTLEMENT_CIRCLE_LAYER_ID } from './useSettlementMarkers';

const ROUTE_SOURCE_ID = 'trip-route';
const ROUTE_CASING_LAYER_ID = 'trip-route-casing';
const ROUTE_LAYER_ID = 'trip-route-layer';
const STOPS_SOURCE_ID = 'trip-stops';
const STOPS_CIRCLE_LAYER_ID = 'trip-stops-circle';
const STOPS_LABEL_LAYER_ID = 'trip-stops-label';

/** Порядок важен: слой нельзя удалить после источника, на котором он висит. */
const LAYER_IDS = [
  ROUTE_LAYER_ID,
  ROUTE_CASING_LAYER_ID,
  STOPS_LABEL_LAYER_ID,
  STOPS_CIRCLE_LAYER_ID,
];
const SOURCE_IDS = [ROUTE_SOURCE_ID, STOPS_SOURCE_ID];

function toRouteFeature(trip: Trip): Feature {
  // routeGeometry приходит с бэкенда уже в [lon, lat] — пересобирать её нельзя.
  return { type: 'Feature', geometry: trip.routeGeometry, properties: {} };
}

/**
 * Точки выгрузки с номерами. Первый и последний элементы `stopOrder` — это хаб
 * (выезд и возврат), его нумеровать нечем: номер получают только сами остановки.
 */
function toStopsCollection(trip: Trip, settlements: Settlement[]): FeatureCollection {
  const byCode = new Map(settlements.map((settlement) => [settlement.code, settlement]));

  const features = trip.stopOrder.slice(1, -1).flatMap((code, index) => {
    const settlement = byCode.get(code);
    if (!settlement) return []; // посёлок вне справочника рисовать нечем

    return [
      {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [settlement.lon, settlement.lat], // [lon, lat] — порядок GeoJSON
        },
        properties: {
          code,
          stopNumber: String(index + 1),
        },
      },
    ];
  });

  return { type: 'FeatureCollection', features };
}

function removeRouteLayers(map: maplibregl.Map) {
  LAYER_IDS.forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  SOURCE_IDS.forEach((id) => {
    if (map.getSource(id)) map.removeSource(id);
  });
}

/**
 * Маршрут сводного рейса: одна ломаная поверх приглушённых линий заявок
 * и пронумерованные остановки. Контраст «шесть прямых → одна ломаная»
 * и есть визуальный аргумент проекта, поэтому линии заявок не удаляются.
 */
export function useRouteLine(trip: Trip | undefined, settlements: Settlement[] | undefined) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (!trip) {
      removeRouteLayers(map);
      return;
    }

    const routeData = toRouteFeature(trip);
    const stopsData = toStopsCollection(trip, settlements ?? []);

    const existingRoute = map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (existingRoute) {
      existingRoute.setData(routeData);
      (map.getSource(STOPS_SOURCE_ID) as maplibregl.GeoJSONSource).setData(stopsData);
      return;
    }

    map.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: routeData });
    map.addSource(STOPS_SOURCE_ID, { type: 'geojson', data: stopsData });

    // Маршрут — под кружками посёлков, но над линиями заявок: они добавлены
    // с тем же beforeId раньше, а MapLibre вставляет новый слой ближе к beforeId.
    const beforeId = map.getLayer(SETTLEMENT_CIRCLE_LAYER_ID)
      ? SETTLEMENT_CIRCLE_LAYER_ID
      : undefined;

    map.addLayer(
      {
        id: ROUTE_CASING_LAYER_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ROUTE_LINE_CASING_COLOR,
          'line-width': ROUTE_LINE_CASING_WIDTH,
          'line-opacity': ROUTE_LINE_OPACITY,
        },
      },
      beforeId,
    );

    map.addLayer(
      {
        id: ROUTE_LAYER_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ROUTE_LINE_COLOR,
          'line-width': ROUTE_LINE_WIDTH,
          'line-opacity': ROUTE_LINE_OPACITY,
        },
      },
      beforeId,
    );

    // Номера остановок — самым верхним слоем: их не должны перекрывать подписи стиля.
    map.addLayer({
      id: STOPS_CIRCLE_LAYER_ID,
      type: 'circle',
      source: STOPS_SOURCE_ID,
      paint: {
        'circle-radius': TRIP_STOP_CIRCLE_RADIUS,
        'circle-color': ROUTE_LINE_COLOR,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });

    map.addLayer({
      id: STOPS_LABEL_LAYER_ID,
      type: 'symbol',
      source: STOPS_SOURCE_ID,
      layout: {
        'text-field': ['get', 'stopNumber'],
        'text-font': MAP_LABEL_FONT,
        'text-size': TRIP_STOP_LABEL_SIZE,
        'text-allow-overlap': true, // номер без кружка бессмыслен, прятать нельзя
        'text-ignore-placement': true,
      },
      paint: {
        'text-color': '#ffffff',
      },
    });
  }, [map, trip, settlements]);
}
