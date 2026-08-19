/**
 * Проверка ответов бэкенда на соответствие контракту (`src/api/types.ts`).
 *
 * Нужна ровно на один час — на стыковку под дедлайн, когда расхождения полезут
 * (`weight_kg` вместо `weightKg`, строка вместо числа, перепутанные lat/lon).
 * Через UI такие вещи ищутся долго: приложение просто рисует пустоту.
 */

import type { Settlement } from '@/api/types';

export interface ContractIssue {
  path: string;
  problem: string;
  /** `info` — фронтенду не мешает, но знать полезно (например, лишнее поле). */
  severity: 'error' | 'info';
}

/** Ожидаемый тип поля. Несколько вариантов через `|`, как в TypeScript. */
type FieldType = string;
type Spec = Record<string, FieldType>;

/** Мангистау целиком с запасом. Ловит перепутанные местами lat и lon. */
const MANGYSTAU_BOUNDS = { minLat: 42, maxLat: 47, minLon: 49, maxLon: 57 };

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const ORDER_STATUSES = ['new', 'pooled', 'routed'];
const REPORT_SOURCES = ['gemini', 'mock'];

function typeOf(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function checkFields(value: unknown, spec: Spec, path: string): ContractIssue[] {
  const actualType = typeOf(value);
  if (actualType !== 'object') {
    return [{ path, problem: `ожидался объект, пришло ${actualType}`, severity: 'error' }];
  }

  const record = value as Record<string, unknown>;
  const issues: ContractIssue[] = [];

  for (const [field, expected] of Object.entries(spec)) {
    if (!(field in record)) {
      issues.push({ path: `${path}.${field}`, problem: `поля нет, ждём ${expected}`, severity: 'error' });
      continue;
    }

    const actual = typeOf(record[field]);
    if (!expected.split('|').includes(actual)) {
      issues.push({ path: `${path}.${field}`, problem: `${actual}, ждём ${expected}`, severity: 'error' });
    }
  }

  for (const field of Object.keys(record)) {
    if (field in spec) continue;
    issues.push({ path: `${path}.${field}`, problem: 'лишнее поле, фронтенд его не читает', severity: 'info' });
  }

  return issues;
}

const settlementSpec: Spec = {
  id: 'number',
  code: 'string',
  nameRu: 'string',
  nameKz: 'string|null',
  district: 'string|null',
  lat: 'number',
  lon: 'number',
};

const orderSpec: Spec = {
  id: 'string',
  code: 'string',
  from: 'object',
  to: 'object',
  shipperName: 'string',
  cargoName: 'string',
  weightKg: 'number',
  boxesCount: 'number|null',
  boxNote: 'string|null',
  color: 'string',
  status: 'string',
  createdAt: 'string',
};

const poolSpec: Spec = {
  totalWeightKg: 'number',
  ordersCount: 'number',
  thresholdKg: 'number',
  isReady: 'boolean',
};

const tripOrderSpec: Spec = {
  orderCode: 'string',
  dropIndex: 'number',
  loadPosition: 'number',
  priceKzt: 'number',
  legDistanceKm: 'number',
};

const tripSpec: Spec = {
  id: 'string',
  code: 'string',
  stopOrder: 'array',
  routeGeometry: 'object',
  totalDistanceKm: 'number',
  soloDistanceKm: 'number',
  savedDistanceKm: 'number',
  savedCostKzt: 'number',
  totalWeightKg: 'number',
  orders: 'array',
  report: 'string',
  reportSource: 'string',
};

function checkCoordinate(lon: unknown, lat: unknown, path: string): ContractIssue[] {
  if (typeof lon !== 'number' || typeof lat !== 'number') {
    return [{ path, problem: 'координата не число', severity: 'error' }];
  }

  const { minLat, maxLat, minLon, maxLon } = MANGYSTAU_BOUNDS;
  if (lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon) return [];

  // Самая дорогая ошибка проекта: с перепутанным порядком линии уезжают в океан.
  const looksSwapped = lon >= minLat && lon <= maxLat && lat >= minLon && lat <= maxLon;
  return [
    {
      path,
      problem: looksSwapped
        ? `[${lon}, ${lat}] — похоже на [lat, lon]; ждём [lon, lat]`
        : `[${lon}, ${lat}] вне Мангистау`,
      severity: 'error',
    },
  ];
}

export function checkSettlements(data: unknown): ContractIssue[] {
  if (!Array.isArray(data)) {
    return [{ path: 'ответ', problem: `${typeOf(data)}, ждём массив`, severity: 'error' }];
  }
  if (data.length === 0) {
    return [{ path: 'ответ', problem: 'пустой справочник — карта будет без точек', severity: 'error' }];
  }

  const issues = checkFields(data[0], settlementSpec, 'settlements[0]');

  data.forEach((item, index) => {
    const settlement = item as Partial<Settlement>;
    issues.push(...checkCoordinate(settlement.lon, settlement.lat, `settlements[${index}] (${settlement.code ?? '?'})`));
  });

  return issues;
}

export function checkOrders(data: unknown): ContractIssue[] {
  if (!Array.isArray(data)) {
    return [{ path: 'ответ', problem: `${typeOf(data)}, ждём массив`, severity: 'error' }];
  }
  if (data.length === 0) return [];

  const first = data[0] as Record<string, unknown>;
  const issues = checkFields(first, orderSpec, 'orders[0]');
  issues.push(...checkFields(first.from, settlementSpec, 'orders[0].from'));
  issues.push(...checkFields(first.to, settlementSpec, 'orders[0].to'));

  if (typeof first.color === 'string' && !HEX_COLOR.test(first.color)) {
    issues.push({
      path: 'orders[0].color',
      problem: `«${first.color}» — ждём #rrggbb, иначе линия не отрисуется`,
      severity: 'error',
    });
  }

  if (typeof first.status === 'string' && !ORDER_STATUSES.includes(first.status)) {
    issues.push({
      path: 'orders[0].status',
      problem: `«${first.status}», ждём одно из ${ORDER_STATUSES.join(' | ')}`,
      severity: 'error',
    });
  }

  return issues;
}

export function checkPool(data: unknown): ContractIssue[] {
  return checkFields(data, poolSpec, 'pool');
}

export function checkTrip(data: unknown): ContractIssue[] {
  const issues = checkFields(data, tripSpec, 'trip');
  if (typeOf(data) !== 'object') return issues;

  const trip = data as Record<string, unknown>;

  const geometry = trip.routeGeometry as Record<string, unknown> | undefined;
  if (geometry) {
    if (geometry.type !== 'LineString') {
      issues.push({
        path: 'trip.routeGeometry.type',
        problem: `«${String(geometry.type)}», ждём LineString`,
        severity: 'error',
      });
    }

    const coordinates = geometry.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      issues.push({
        path: 'trip.routeGeometry.coordinates',
        problem: 'меньше двух точек — маршрут не нарисовать',
        severity: 'error',
      });
    } else {
      // Хватает краёв и середины: гонять тысячу точек ORS через проверку незачем.
      const probes = [0, Math.floor(coordinates.length / 2), coordinates.length - 1];
      for (const index of probes) {
        const point = coordinates[index] as [unknown, unknown];
        issues.push(...checkCoordinate(point?.[0], point?.[1], `trip.routeGeometry.coordinates[${index}]`));
      }
    }
  }

  if (Array.isArray(trip.orders) && trip.orders.length > 0) {
    issues.push(...checkFields(trip.orders[0], tripOrderSpec, 'trip.orders[0]'));
  }

  if (Array.isArray(trip.stopOrder) && trip.stopOrder.some((code) => typeof code !== 'string')) {
    issues.push({ path: 'trip.stopOrder', problem: 'ждём массив кодов посёлков', severity: 'error' });
  }

  if (typeof trip.reportSource === 'string' && !REPORT_SOURCES.includes(trip.reportSource)) {
    issues.push({
      path: 'trip.reportSource',
      problem: `«${trip.reportSource}», ждём ${REPORT_SOURCES.join(' | ')}`,
      severity: 'info',
    });
  }

  if (typeof trip.report === 'string' && trip.report.trim().length === 0) {
    issues.push({ path: 'trip.report', problem: 'пустой отчёт — вкладка будет пустой', severity: 'error' });
  }

  return issues;
}
