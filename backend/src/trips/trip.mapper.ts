import { ReportRow, TripOrderRow, TripResponse, TripRow } from './trip.types';

export function mapTrip(
  trip: TripRow,
  tripOrders: TripOrderRow[],
  report: ReportRow | null,
): TripResponse {
  return {
    id: trip.id,
    code: trip.code,
    stopOrder: trip.stop_order,
    routeGeometry: trip.route_geometry,
    totalDistanceKm: Number(trip.total_distance_km),
    soloDistanceKm: Number(trip.solo_distance_km),
    savedDistanceKm: Number(trip.saved_distance_km),
    savedCostKzt: Number(trip.saved_cost_kzt),
    totalWeightKg: Number(trip.total_weight_kg),
    orders: tripOrders.map((row) => ({
      orderCode: row.order.code,
      dropIndex: row.drop_index,
      loadPosition: row.load_position,
      priceKzt: Number(row.price_kzt),
      legDistanceKm: Number(row.leg_distance_km),
    })),
    report: report?.content_md ?? '',
    reportSource: report?.source ?? 'mock',
  };
}
