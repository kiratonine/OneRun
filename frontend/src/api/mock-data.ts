/**
 * Фикстуры на время разработки, пока бэкенд не отдал ручки.
 * Заменяются реальным API одной строкой в .env (VITE_API_BASE_URL).
 *
 * Координаты посёлков получены из Nominatim (OpenStreetMap) 19.08.2026,
 * запросом вида https://nominatim.openstreetmap.org/search?q=<название>&format=json
 * Ни одна координата не выдумана — это требование ТЗ (AC-13).
 */

import { ORDER_LINE_COLORS } from '@/config/constants';
import { formatKg, formatKm, formatKzt } from '@/lib/format';
import type { Order, PoolStatus, Settlement, Trip, TripOrderLine } from './types';

const HUB_CODE = 'AKTAU';
const POOL_WEIGHT_THRESHOLD_KG = 500;

/** Себестоимость километра из ТЗ §11: (25/100) × 340 × 2.1 ≈ 178,5 тг/км. */
const COST_PER_KM_KZT = (25 / 100) * 340 * 2.1;

/** Коэффициент извилистости для мока — реальную геометрию отдаст ORS через бэкенд. */
const STRAIGHT_LINE_DETOUR_FACTOR = 1.3;

export const mockSettlements: Settlement[] = [
  {
    id: 1,
    code: 'AKTAU',
    nameRu: 'Актау',
    nameKz: 'Ақтау',
    district: 'г. Актау',
    lat: 43.6353364,
    lon: 51.168222,
  },
  {
    id: 2,
    code: 'AKSHUKUR',
    nameRu: 'Акшукур',
    nameKz: 'Ақшұқыр',
    district: 'Тупкараганский',
    lat: 43.7831766,
    lon: 51.0605022,
  },
  {
    id: 3,
    code: 'SHETPE',
    nameRu: 'Шетпе',
    nameKz: 'Шетпе',
    district: 'Мангистауский',
    lat: 44.1413139,
    lon: 52.1556413,
  },
  {
    id: 4,
    code: 'BEINEU',
    nameRu: 'Бейнеу',
    nameKz: 'Бейнеу',
    district: 'Бейнеуский',
    lat: 45.321377,
    lon: 55.186226,
  },
  {
    id: 5,
    code: 'ZHANAOZEN',
    nameRu: 'Жанаозен',
    nameKz: 'Жаңаөзен',
    district: 'г. Жанаозен',
    lat: 43.3381034,
    lon: 52.8556219,
  },
  {
    id: 6,
    code: 'KURYK',
    nameRu: 'Курык',
    nameKz: 'Құрық',
    district: 'Каракиянский',
    lat: 43.176664,
    lon: 51.6796799,
  },
  {
    id: 7,
    code: 'ZHETYBAI',
    nameRu: 'Жетыбай',
    nameKz: 'Жетібай',
    district: 'Каракиянский',
    lat: 43.5883652,
    lon: 52.1014626,
  },
  {
    id: 8,
    code: 'MUNAILY',
    nameRu: 'Мунайшы',
    nameKz: 'Мұнайшы',
    district: 'Каракиянский',
    lat: 43.4985033,
    lon: 52.0879358,
  },
  {
    id: 9,
    code: 'SENEK',
    nameRu: 'Сенек',
    nameKz: 'Сенек',
    district: 'Каракиянский',
    lat: 43.364754,
    lon: 53.388226,
  },
  {
    id: 10,
    code: 'TAUCHIK',
    nameRu: 'Таушык',
    nameKz: 'Таушық',
    district: 'Тупкараганский',
    lat: 44.3465058,
    lon: 51.3486586,
  },
  {
    id: 11,
    code: 'SAYOTES',
    nameRu: 'Сайотес',
    nameKz: 'Сайөтес',
    district: 'Мангистауский',
    lat: 44.327709,
    lon: 53.533142,
  },
  {
    id: 12,
    code: 'FORTSHEVCHENKO',
    nameRu: 'Форт-Шевченко',
    nameKz: 'Форт-Шевченко',
    district: 'Тупкараганский',
    lat: 44.508556,
    lon: 50.261929,
  },
];

const byCode = new Map(mockSettlements.map((s) => [s.code, s]));

function settlement(code: string): Settlement {
  const found = byCode.get(code);
  if (!found) throw new Error(`Посёлок ${code} отсутствует в справочнике мока`);
  return found;
}

/**
 * Демо-набор. Сумма первых пяти = 440 кг (< 500), шестая переводит пул на 520 кг —
 * та самая цифра, которую спикер называет вслух на 25-й секунде демо (ТЗ §13).
 */
interface MockOrderSeed {
  toCode: string;
  shipperName: string;
  cargoName: string;
  weightKg: number;
  boxesCount: number | null;
  boxNote: string | null;
}

export const mockOrderSeeds: MockOrderSeed[] = [
  {
    toCode: 'AKSHUKUR',
    shipperName: 'ИП «Нұрсая»',
    cargoName: 'Продукты питания',
    weightKg: 80,
    boxesCount: 8,
    boxNote: '8 коробок по 10 кг, 40×30×30',
  },
  {
    toCode: 'SHETPE',
    shipperName: 'ТОО «Каспий Құрылыс»',
    cargoName: 'Стройматериалы',
    weightKg: 120,
    boxesCount: 6,
    boxNote: '6 мешков по 20 кг, цемент',
  },
  {
    toCode: 'ZHETYBAI',
    shipperName: 'ИП Ералиев',
    cargoName: 'Запчасти',
    weightKg: 60,
    boxesCount: 3,
    boxNote: '3 ящика по 20 кг, 60×40×40',
  },
  {
    toCode: 'KURYK',
    shipperName: 'ТОО «Мангистау Техно»',
    cargoName: 'Бытовая техника',
    weightKg: 95,
    boxesCount: 5,
    boxNote: '5 мест, хрупкое — не штабелировать',
  },
  {
    toCode: 'ZHANAOZEN',
    shipperName: 'ИП «Береке»',
    cargoName: 'Продукты питания',
    weightKg: 85,
    boxesCount: 7,
    boxNote: '7 коробок, скоропортящееся',
  },
  {
    toCode: 'BEINEU',
    shipperName: 'ТОО «Бейнеу Құрылыс»',
    cargoName: 'Стройматериалы',
    weightKg: 80,
    boxesCount: 4,
    boxNote: '4 поддона по 20 кг, профлист',
  },
];

const MOCK_CREATED_AT = '2026-08-19T09:00:00.000Z';

export const mockOrders: Order[] = mockOrderSeeds.map((seed, index) => ({
  id: `mock-order-${index + 1}`,
  code: `ORD-${String(index + 1).padStart(3, '0')}`,
  from: settlement(HUB_CODE),
  to: settlement(seed.toCode),
  shipperName: seed.shipperName,
  cargoName: seed.cargoName,
  weightKg: seed.weightKg,
  boxesCount: seed.boxesCount,
  boxNote: seed.boxNote,
  color: ORDER_LINE_COLORS[index % ORDER_LINE_COLORS.length],
  status: 'new',
  createdAt: MOCK_CREATED_AT,
}));

export function buildMockPool(orders: Order[]): PoolStatus {
  const totalWeightKg = orders.reduce((sum, order) => sum + order.weightKg, 0);
  return {
    totalWeightKg,
    ordersCount: orders.length,
    thresholdKg: POOL_WEIGHT_THRESHOLD_KG,
    isReady: totalWeightKg >= POOL_WEIGHT_THRESHOLD_KG,
  };
}

const EARTH_RADIUS_KM = 6371;

function haversineKm(a: Settlement, b: Settlement): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Nearest-neighbour от хаба — тот же алгоритм, что будет на бэкенде. */
function nearestNeighbourOrder(hub: Settlement, destinations: Settlement[]): Settlement[] {
  const remaining = [...destinations];
  const route: Settlement[] = [];
  let current = hub;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDistance = Infinity;
    remaining.forEach((candidate, index) => {
      const distance = haversineKm(current, candidate);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    current = remaining[bestIndex];
    route.push(current);
    remaining.splice(bestIndex, 1);
  }

  return route;
}

/**
 * Мок рейса. Геометрия — прямые отрезки между точками: реальную ломаную по дорогам
 * отдаст ORS через бэкенд. Числа считаются по формулам ТЗ §11, чтобы вёрстка
 * панели экономики и отчёта проверялась на правдоподобных значениях.
 */
export function buildMockTrip(orders: Order[]): Trip {
  const hub = settlement(HUB_CODE);
  const destinations = orders.map((order) => order.to);
  const ordered = nearestNeighbourOrder(hub, destinations);
  const stops = [hub, ...ordered, hub];

  const totalDistanceKm =
    Math.round(
      stops.reduce(
        (sum, stop, index) =>
          index === 0 ? sum : sum + haversineKm(stops[index - 1], stop),
        0,
      ) * STRAIGHT_LINE_DETOUR_FACTOR,
    ) || 0;

  const legs = orders.map((order) => ({
    order,
    legDistanceKm: Math.round(haversineKm(hub, order.to) * STRAIGHT_LINE_DETOUR_FACTOR),
  }));

  const totalTkm = legs.reduce(
    (sum, leg) => sum + (leg.order.weightKg / 1000) * leg.legDistanceKm,
    0,
  );
  const tripCostKzt = totalDistanceKm * COST_PER_KM_KZT;

  const dropIndexByCode = new Map(ordered.map((stop, index) => [stop.code, index + 1]));

  const tripOrders: TripOrderLine[] = legs.map(({ order, legDistanceKm }) => {
    const share = totalTkm > 0 ? ((order.weightKg / 1000) * legDistanceKm) / totalTkm : 0;
    const dropIndex = dropIndexByCode.get(order.to.code) ?? 1;
    return {
      orderCode: order.code,
      dropIndex,
      loadPosition: dropIndex, // LIFO: выгружается первым — грузится последним
      priceKzt: Math.round(tripCostKzt * share),
      legDistanceKm,
    };
  });

  const soloDistanceKm = legs.reduce((sum, leg) => sum + leg.legDistanceKm * 2, 0);
  const savedDistanceKm = soloDistanceKm - totalDistanceKm;

  const trip: Trip = {
    id: 'mock-trip-1',
    code: 'TRIP-001',
    stopOrder: stops.map((stop) => stop.code),
    routeGeometry: {
      type: 'LineString',
      coordinates: stops.map((stop) => [stop.lon, stop.lat]), // [lon, lat] — GeoJSON
    },
    totalDistanceKm,
    soloDistanceKm,
    savedDistanceKm,
    savedCostKzt: Math.round(savedDistanceKm * COST_PER_KM_KZT),
    totalWeightKg: orders.reduce((sum, order) => sum + order.weightKg, 0),
    orders: tripOrders,
    report: '',
    reportSource: 'mock',
  };

  return { ...trip, report: buildMockReport(trip, orders) };
}

/**
 * Отчёт мока. На бэкенде его пишет Gemini, но подстраховка нужна: если модель
 * не ответит, вкладка «Отчёт» должна показывать документ, а не пустоту.
 * Заодно на нём проверяется типографика — здесь есть заголовки, списки и таблица.
 */
function buildMockReport(trip: Trip, orders: Order[]): string {
  const orderByCode = new Map(orders.map((order) => [order.code, order]));
  const savedPercent =
    trip.soloDistanceKm > 0 ? Math.round((trip.savedDistanceKm / trip.soloDistanceKm) * 100) : 0;
  const routeText = trip.stopOrder.map((code) => settlement(code).nameRu).join(' → ');

  const tableRows = [...trip.orders]
    .sort((a, b) => a.dropIndex - b.dropIndex)
    .map((line) => {
      const order = orderByCode.get(line.orderCode);
      const to = order ? order.to.nameRu : line.orderCode;
      const weight = order ? formatKg(order.weightKg) : '—';
      return `| ${line.dropIndex} | ${to} | ${line.orderCode} | ${weight} | ${formatKm(line.legDistanceKm)} | ${formatKzt(line.priceKzt)} |`;
    });

  // Погрузка обратна выгрузке: то, что снимут первым, ставят у дверей последним.
  const loadingSteps = [...trip.orders]
    .sort((a, b) => b.loadPosition - a.loadPosition)
    .map((line, index) => {
      const order = orderByCode.get(line.orderCode);
      const to = order ? order.to.nameRu : line.orderCode;
      const cargo = order ? `${order.cargoName.toLowerCase()}, ${formatKg(order.weightKg)}` : '';
      return `${index + 1}. **${line.orderCode}** → ${to} (${cargo})`;
    });

  return [
    `## Сводный рейс ${trip.code}`,
    '',
    `Маршрут: **${routeText}**. В машине ${orders.length} заявок общим весом ${formatKg(trip.totalWeightKg)}, пробег — ${formatKm(trip.totalDistanceKm)}.`,
    '',
    '### Порядок погрузки',
    '',
    'Грузим в обратном порядке к выгрузке: то, что снимут первым, ставим у дверей последним.',
    '',
    ...loadingSteps,
    '',
    '### Маршрут и выгрузка',
    '',
    '| № | Посёлок | Заявка | Вес | Плечо | Стоимость |',
    '| --- | --- | --- | --- | --- | --- |',
    ...tableRows,
    '',
    '### Экономика',
    '',
    `- Отдельными рейсами: **${formatKm(trip.soloDistanceKm)}**`,
    `- Сводным рейсом: **${formatKm(trip.totalDistanceKm)}**`,
    `- Экономия: **${formatKm(trip.savedDistanceKm)}** (${savedPercent}%), в деньгах — **${formatKzt(trip.savedCostKzt)}**`,
    '',
    '> Черновик: отчёт составлен локально, без обращения к модели.',
  ].join('\n');
}
