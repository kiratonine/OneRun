import { EARTH_RADIUS_KM } from '../config/constants';
import { RoutingPoint } from './routing.types';

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineDistanceKm(
  from: Pick<RoutingPoint, 'lat' | 'lon'>,
  to: Pick<RoutingPoint, 'lat' | 'lon'>,
): number {
  const latitudeDelta = toRadians(to.lat - from.lat);
  const longitudeDelta = toRadians(to.lon - from.lon);
  const fromLatitude = toRadians(from.lat);
  const toLatitude = toRadians(to.lat);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(haversine));
}

export function orderByNearestNeighbour(
  hub: RoutingPoint,
  destinations: RoutingPoint[],
): RoutingPoint[] {
  const remaining = [...destinations];
  const ordered: RoutingPoint[] = [];
  let current = hub;

  while (remaining.length > 0) {
    remaining.sort((left, right) => {
      const distanceDelta =
        haversineDistanceKm(current, left) -
        haversineDistanceKm(current, right);
      return distanceDelta || left.code.localeCompare(right.code);
    });

    const next = remaining.shift();
    if (!next) {
      break;
    }
    ordered.push(next);
    current = next;
  }

  return ordered;
}
