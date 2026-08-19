export const POOL_WEIGHT_THRESHOLD_KG = 500;
export const HUB_SETTLEMENT_CODE = 'AKTAU';

export const FUEL_CONSUMPTION_L_PER_100KM = 25;
export const DIESEL_PRICE_KZT_PER_L = 340;
export const OVERHEAD_MULTIPLIER = 2.1;
export const COST_PER_KM_KZT =
  (FUEL_CONSUMPTION_L_PER_100KM / 100) *
  DIESEL_PRICE_KZT_PER_L *
  OVERHEAD_MULTIPLIER;

export const ORS_BASE_URL = 'https://api.openrouteservice.org/v2';
export const ORS_PROFILE = 'driving-hgv';
export const ORS_TIMEOUT_MS = 10_000;

export const STRAIGHT_LINE_DETOUR_FACTOR = 1.3;
export const EARTH_RADIUS_KM = 6371;

export const ORDER_LINE_COLORS = [
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#a855f7',
  '#ec4899',
] as const;

export const orsRequestConfig = {
  headers: { Authorization: process.env.ORS_API_KEY ?? '' },
  timeout: ORS_TIMEOUT_MS,
} as const;
