import { useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';

import {
  ORDER_LINE_HIT_WIDTH,
  ORDER_LINE_OPACITY,
  ORDER_LINE_SELECTED_WIDTH,
  ORDER_LINE_WIDTH,
} from '@/config/constants';
import type { Order } from '@/api/types';
import { useMap } from './MapContext';
import { SETTLEMENT_CIRCLE_LAYER_ID } from './useSettlementMarkers';

const SOURCE_ID = 'order-lines';
const LINE_LAYER_ID = 'order-lines-layer';
/** Прозрачный широкий дубль той же геометрии — только чтобы ловить клик и ховер. */
const HIT_LAYER_ID = 'order-lines-hit';

function toFeatureCollection(orders: Order[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: orders.map((order) => ({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        // [lon, lat] — порядок GeoJSON. Собираем вручную: в Settlement поля раздельные.
        coordinates: [
          [order.from.lon, order.from.lat],
          [order.to.lon, order.to.lat],
        ],
      },
      properties: {
        orderCode: order.code,
        color: order.color,
      },
    })),
  };
}

/** Ширина линий: выбранная толще остальных. Плоское число, пока ничего не выбрано. */
function lineWidthPaint(selectedOrderCode: string | null) {
  if (!selectedOrderCode) return ORDER_LINE_WIDTH;
  return [
    'case',
    ['==', ['get', 'orderCode'], selectedOrderCode],
    ORDER_LINE_SELECTED_WIDTH,
    ORDER_LINE_WIDTH,
  ];
}

interface UseOrderLinesOptions {
  selectedOrderCode: string | null;
  onSelectOrder: (orderCode: string) => void;
}

/**
 * Линии заявок «откуда → куда». Один источник и один видимый слой на все заявки:
 * новая заявка не добавляет слой, а обновляет данные через setData.
 */
export function useOrderLines(
  orders: Order[] | undefined,
  { selectedOrderCode, onSelectOrder }: UseOrderLinesOptions,
) {
  const map = useMap();

  // Колбэк живёт в ref: обработчики карты вешаются один раз и не должны
  // переподписываться на каждый рендер родителя.
  const onSelectOrderRef = useRef(onSelectOrder);
  useEffect(() => {
    onSelectOrderRef.current = onSelectOrder;
  });

  useEffect(() => {
    if (!map) return;

    const data = toFeatureCollection(orders ?? []);
    const existing = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;

    if (existing) {
      existing.setData(data);
      return;
    }

    map.addSource(SOURCE_ID, { type: 'geojson', data });

    // Под кружками посёлков: точки назначения должны оставаться читаемыми.
    const beforeId = map.getLayer(SETTLEMENT_CIRCLE_LAYER_ID)
      ? SETTLEMENT_CIRCLE_LAYER_ID
      : undefined;

    map.addLayer(
      {
        id: LINE_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['get', 'color'], // цвет приходит с бэкенда в Order.color
          'line-width': ORDER_LINE_WIDTH,
          'line-opacity': ORDER_LINE_OPACITY,
        },
      },
      beforeId,
    );

    map.addLayer(
      {
        id: HIT_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#000000',
          'line-width': ORDER_LINE_HIT_WIDTH,
          'line-opacity': 0, // невидим, но queryRenderedFeatures его всё равно находит
        },
      },
      beforeId,
    );
  }, [map, orders]);

  useEffect(() => {
    if (!map) return;

    const handleClick = (event: maplibregl.MapLayerMouseEvent) => {
      const orderCode = event.features?.[0]?.properties?.orderCode;
      if (typeof orderCode === 'string') onSelectOrderRef.current(orderCode);
    };
    const showPointer = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const hidePointer = () => {
      map.getCanvas().style.cursor = '';
    };

    // Слоевые подписки делегированные — их можно вешать до появления слоя.
    map.on('click', HIT_LAYER_ID, handleClick);
    map.on('mouseenter', HIT_LAYER_ID, showPointer);
    map.on('mouseleave', HIT_LAYER_ID, hidePointer);

    return () => {
      map.off('click', HIT_LAYER_ID, handleClick);
      map.off('mouseenter', HIT_LAYER_ID, showPointer);
      map.off('mouseleave', HIT_LAYER_ID, hidePointer);
    };
  }, [map]);

  useEffect(() => {
    if (!map?.getLayer(LINE_LAYER_ID)) return;
    map.setPaintProperty(LINE_LAYER_ID, 'line-width', lineWidthPaint(selectedOrderCode));
  }, [map, selectedOrderCode, orders]);
}
