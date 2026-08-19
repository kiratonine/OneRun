/**
 * Контракт API. Согласован с бэкендом (plan-frontend.md §4, plan-backend-1.md §7).
 * Не менять в одностороннем порядке.
 */

export interface Settlement {
  id: number;
  code: string; // 'AKTAU'
  nameRu: string; // 'Актау'
  nameKz: string | null;
  district: string | null;
  lat: number;
  lon: number;
}

export interface Order {
  id: string;
  code: string; // 'ORD-001'
  from: Settlement;
  to: Settlement;
  shipperName: string;
  cargoName: string;
  weightKg: number;
  boxesCount: number | null;
  boxNote: string | null;
  color: string; // '#ef4444' — цвет линии, приходит с бэка
  status: 'new' | 'pooled' | 'routed';
  createdAt: string;
}

export interface PoolStatus {
  totalWeightKg: number;
  ordersCount: number;
  thresholdKg: number;
  isReady: boolean;
}

export interface TripOrderLine {
  orderCode: string;
  dropIndex: number; // 1 = выгружается первым
  loadPosition: number; // 1 = грузится последним, ставится у дверей
  priceKzt: number;
  legDistanceKm: number;
}

export interface Trip {
  id: string;
  code: string; // 'TRIP-001'
  stopOrder: string[]; // ['AKTAU','AKSHUKUR','SHETPE','AKTAU']
  routeGeometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [lon, lat] — порядок как в GeoJSON
  };
  totalDistanceKm: number;
  soloDistanceKm: number;
  savedDistanceKm: number;
  savedCostKzt: number;
  totalWeightKg: number;
  orders: TripOrderLine[];
  report: string; // Markdown
  reportSource: 'gemini' | 'mock';
}

/** Тело POST /api/orders. */
export interface CreateOrderPayload {
  fromCode: string;
  toCode: string;
  shipperName: string;
  cargoName: string;
  weightKg: number;
  boxesCount?: number;
  boxNote?: string;
}
