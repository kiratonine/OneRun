import { LineStringGeometry } from '../routing/routing.types';

export interface TripOrderResponse {
  orderCode: string;
  dropIndex: number;
  loadPosition: number;
  priceKzt: number;
  legDistanceKm: number;
}

export interface TripResponse {
  id: string;
  code: string;
  stopOrder: string[];
  routeGeometry: LineStringGeometry;
  totalDistanceKm: number;
  soloDistanceKm: number;
  savedDistanceKm: number;
  savedCostKzt: number;
  totalWeightKg: number;
  orders: TripOrderResponse[];
  report: string;
  reportSource: 'gemini' | 'mock';
}

export interface TripRow {
  id: string;
  code: string;
  stop_order: string[];
  route_geometry: LineStringGeometry;
  total_distance_km: number;
  solo_distance_km: number;
  saved_distance_km: number;
  saved_cost_kzt: number;
  total_weight_kg: number;
}

export interface TripOrderRow {
  price_kzt: number;
  load_position: number;
  drop_index: number;
  leg_distance_km: number;
  order: { code: string };
}

export interface ReportRow {
  content_md: string;
  source: 'gemini' | 'mock';
}
