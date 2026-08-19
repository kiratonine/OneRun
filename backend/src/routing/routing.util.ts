import {
  COST_PER_KM_KZT,
  EARTH_RADIUS_KM,
  LOAD_COST_PER_TONNE_KM_KZT,
} from '../config/constants';
import { RoutingDestination, RoutingPoint } from './routing.types';

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

export interface RoutingCostModel {
  costPerKmKzt: number;
  loadCostPerTonneKmKzt: number;
}

const DEFAULT_ROUTING_COST_MODEL: RoutingCostModel = {
  costPerKmKzt: COST_PER_KM_KZT,
  loadCostPerTonneKmKzt: LOAD_COST_PER_TONNE_KM_KZT,
};

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

function assertCostInputs(
  destinations: RoutingDestination[],
  costModel: RoutingCostModel,
): void {
  if (
    !Number.isFinite(costModel.costPerKmKzt) ||
    costModel.costPerKmKzt < 0 ||
    !Number.isFinite(costModel.loadCostPerTonneKmKzt) ||
    costModel.loadCostPerTonneKmKzt < 0
  ) {
    throw new Error('Routing cost values must be finite and non-negative');
  }

  if (
    destinations.some(
      ({ deliveryWeightKg }) =>
        !Number.isFinite(deliveryWeightKg) || deliveryWeightKg < 0,
    )
  ) {
    throw new Error('Delivery weights must be finite and non-negative');
  }
}

function legOperatingCost(
  distanceKm: number,
  payloadKg: number,
  costModel: RoutingCostModel,
): number {
  return (
    distanceKm * costModel.costPerKmKzt +
    distanceKm * (payloadKg / 1000) * costModel.loadCostPerTonneKmKzt
  );
}

export function orderByLowestOperatingCost(
  hub: RoutingPoint,
  destinations: RoutingDestination[],
  distanceMatrix?: DistanceMatrix,
  costModel: RoutingCostModel = DEFAULT_ROUTING_COST_MODEL,
): RoutingDestination[] {
  if (destinations.length === 0) {
    return [];
  }

  assertCostInputs(destinations, costModel);
  const points = [hub, ...destinations];
  const distances = distanceMatrix ?? haversineDistanceMatrix(points);
  assertDistanceMatrix(distances, points.length);

  let bestIndices: number[] | undefined;
  let bestCost = Number.POSITIVE_INFINITY;
  const initialPayloadKg = destinations.reduce(
    (sum, { deliveryWeightKg }) => sum + deliveryWeightKg,
    0,
  );

  function visit(
    currentIndex: number,
    remainingIndices: number[],
    orderedIndices: number[],
    payloadKg: number,
    travelledCost: number,
  ): void {
    if (remainingIndices.length === 0) {
      const roundTripCost =
        travelledCost +
        legOperatingCost(distances[currentIndex][0], payloadKg, costModel);
      const candidateCodes = orderedIndices
        .map((index) => points[index].code)
        .join('\u0000');
      const bestCodes = bestIndices
        ?.map((index) => points[index].code)
        .join('\u0000');

      if (
        roundTripCost < bestCost ||
        (roundTripCost === bestCost &&
          (bestCodes === undefined || candidateCodes < bestCodes))
      ) {
        bestCost = roundTripCost;
        bestIndices = [...orderedIndices];
      }
      return;
    }

    for (const nextIndex of remainingIndices) {
      const nextCost =
        travelledCost +
        legOperatingCost(
          distances[currentIndex][nextIndex],
          payloadKg,
          costModel,
        );
      if (nextCost > bestCost) {
        continue;
      }

      const destination = destinations[nextIndex - 1];
      visit(
        nextIndex,
        remainingIndices.filter((index) => index !== nextIndex),
        [...orderedIndices, nextIndex],
        payloadKg - destination.deliveryWeightKg,
        nextCost,
      );
    }
  }

  visit(
    0,
    destinations.map((_, index) => index + 1),
    [],
    initialPayloadKg,
    0,
  );

  return (bestIndices ?? []).map((index) => destinations[index - 1]);
}
