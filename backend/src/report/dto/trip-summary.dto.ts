export interface TripSummaryOrderDto {
  code: string;
  shipperName: string;
  toName: string;
  cargoName: string;
  weightKg: number;
  boxesCount: number | null;
  boxNote: string | null;
  dropIndex: number;
  loadPosition: number;
  priceKzt: number;
  legDistanceKm: number;
}

export interface TripSummaryDto {
  tripCode: string;
  hubName: string;
  stopOrder: string[];
  totalDistanceKm: number;
  soloDistanceKm: number;
  savedDistanceKm: number;
  savedCostKzt: number;
  totalWeightKg: number;
  costPerKmKzt: number;
  orders: TripSummaryOrderDto[];
}

export interface ReportResult {
  contentMd: string;
  raw: unknown | null;
  source: 'gemini' | 'mock';
}
