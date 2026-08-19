import { useEffect, useRef } from 'react';
import type { FilterSpecification } from 'maplibre-gl';

import type { Settlement } from '@/api/types';
import { useMap } from './MapContext';

/** Слой тайлов OpenMapTiles, из которого стиль Liberty берёт подписи населённых пунктов. */
const PLACE_SOURCE_LAYER = 'place';

/**
 * Стиль подписывает те же посёлки, что и мы, только своим шрифтом и без отступа —
 * на карте получаются две подписи рядом (заметно на Бейнеу, Шетпе, Курыке).
 * Гасим чужую подпись там, где стоит наша: сравниваем имя из тайла с русским
 * и казахским названием из справочника. Посёлки не из справочника стиль подписывает
 * как раньше — контекст вокруг маршрута остаётся.
 */
export function useBaseLabelFilter(settlements: Settlement[] | undefined) {
  const map = useMap();
  /** Исходные фильтры слоёв: без них повторный проход вложил бы фильтр сам в себя. */
  const originalFiltersRef = useRef(new Map<string, FilterSpecification | undefined>());

  useEffect(() => {
    if (!map || !settlements?.length) return;

    const ourNames = settlements
      .flatMap((settlement) => [settlement.nameRu, settlement.nameKz])
      .filter((name): name is string => Boolean(name))
      .map((name) => name.toLowerCase());

    // В тайлах имя лежит в разных полях: `name` — как в OSM, `name:nonlatin` —
    // кириллица, которую стиль показывает второй строкой.
    const isOurs: FilterSpecification = [
      'any',
      ['in', ['downcase', ['coalesce', ['get', 'name'], '']], ['literal', ourNames]],
      ['in', ['downcase', ['coalesce', ['get', 'name:nonlatin'], '']], ['literal', ourNames]],
      ['in', ['downcase', ['coalesce', ['get', 'name:ru'], '']], ['literal', ourNames]],
    ];

    const originalFilters = originalFiltersRef.current;

    for (const layer of map.getStyle().layers) {
      if (layer.type !== 'symbol') continue;
      if (!('source-layer' in layer) || layer['source-layer'] !== PLACE_SOURCE_LAYER) continue;

      if (!originalFilters.has(layer.id)) {
        // Типы maplibre объявляют getFilter как void | FilterSpecification.
        originalFilters.set(layer.id, map.getFilter(layer.id) as FilterSpecification | undefined);
      }

      const original = originalFilters.get(layer.id);
      const exclude: FilterSpecification = ['!', isOurs];
      // `all` в типах разведён на выражения и легаси-фильтры, а сюда приходит union
      // из обоих — приведение снимает несводимость, поведение стиля не меняется.
      const next = (original ? ['all', original, exclude] : exclude) as FilterSpecification;

      map.setFilter(layer.id, next);
    }
  }, [map, settlements]);
}
