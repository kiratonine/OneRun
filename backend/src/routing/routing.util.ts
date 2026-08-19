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

type DistanceMatrix = ReadonlyArray<ReadonlyArray<number>>;

function haversineDistanceMatrix(points: RoutingPoint[]): number[][] {
  return points.map((from) =>
    points.map((to) => haversineDistanceKm(from, to)),
  );
}

function assertDistanceMatrix(
  matrix: DistanceMatrix,
  expectedSize: number,
): void {
  if (
    matrix.length !== expectedSize ||
    matrix.some(
      (row) =>
        row.length !== expectedSize ||
        row.some((distance) => !Number.isFinite(distance) || distance < 0),
    )
  ) {
    throw new Error(`Distance matrix must be ${expectedSize}x${expectedSize}`);
  }
}

export function orderByOptimalRoundTrip(
  hub: RoutingPoint,
  destinations: RoutingPoint[],
  distanceMatrix?: DistanceMatrix,
): RoutingPoint[] {
  if (destinations.length === 0) {
    return [];
  }

  const points = [hub, ...destinations];
  const distances = distanceMatrix ?? haversineDistanceMatrix(points);
  assertDistanceMatrix(distances, points.length);

  let bestIndices: number[] | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;

  function visit(
    currentIndex: number,
    remainingIndices: number[],
    orderedIndices: number[],
    travelledDistance: number,
  ): void {
    if (remainingIndices.length === 0) {
      const roundTripDistance = travelledDistance + distances[currentIndex][0];
      const candidateCodes = orderedIndices
        .map((index) => points[index].code)
        .join('\u0000');
      const bestCodes = bestIndices
        ?.map((index) => points[index].code)
        .join('\u0000');

      if (
        roundTripDistance < bestDistance ||
        (roundTripDistance === bestDistance &&
          (bestCodes === undefined || candidateCodes < bestCodes))
      ) {
        bestDistance = roundTripDistance;
        bestIndices = [...orderedIndices];
      }
      return;
    }

    for (const nextIndex of remainingIndices) {
      const nextDistance =
        travelledDistance + distances[currentIndex][nextIndex];
      if (nextDistance > bestDistance) {
        continue;
      }

      visit(
        nextIndex,
        remainingIndices.filter((index) => index !== nextIndex),
        [...orderedIndices, nextIndex],
        nextDistance,
      );
    }
  }

  visit(
    0,
    destinations.map((_, index) => index + 1),
    [],
    0,
  );

  return (bestIndices ?? []).map((index) => points[index]);
}
