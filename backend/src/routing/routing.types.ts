export type Coordinate = [number, number];

export interface RoutingPoint {
  code: string;
  nameRu: string;
  lat: number;
  lon: number;
}

export interface RoutingDestination extends RoutingPoint {
  deliveryWeightKg: number;
  deliveryOrderCount: number;
}

export interface LineStringGeometry {
  type: 'LineString';
  coordinates: Coordinate[];
}

export interface BuiltRoute {
  stopOrder: string[];
  orderedDestinations: RoutingDestination[];
  routeGeometry: LineStringGeometry;
  totalDistanceKm: number;
  distanceFromHubKm: Record<string, number>;
  source: 'ors' | 'fallback';
}
