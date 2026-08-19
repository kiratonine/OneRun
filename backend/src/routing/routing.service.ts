import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import {
  ORS_BASE_URL,
  ORS_PROFILE,
  STRAIGHT_LINE_DETOUR_FACTOR,
  orsRequestConfig,
} from '../config/constants';
import {
  BuiltRoute,
  Coordinate,
  LineStringGeometry,
  RoutingPoint,
} from './routing.types';
import { haversineDistanceKm, orderByOptimalRoundTrip } from './routing.util';

interface OrsGeoJsonResponse {
  features: Array<{
    geometry: LineStringGeometry;
    properties: { summary: { distance: number } };
  }>;
}

interface OrsMatrixResponse {
  distances: Array<Array<number | null>>;
}

interface RouteLeg {
  geometry: LineStringGeometry;
  distanceKm: number;
  source: 'ors' | 'fallback';
}

function coordinateOf(point: RoutingPoint): Coordinate {
  return [point.lon, point.lat];
}

function roundKilometres(value: number): number {
  return Math.round(value * 100) / 100;
}

function describeError(error: unknown): string {
  return axios.isAxiosError(error)
    ? `status=${error.response?.status ?? 'none'} code=${error.code ?? 'none'} message=${error.message}`
    : error instanceof Error
      ? error.message
      : 'unknown error';
}

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);

  async buildRoute(
    hub: RoutingPoint,
    destinations: RoutingPoint[],
  ): Promise<BuiltRoute> {
    const uniqueDestinations = Array.from(
      new Map(destinations.map((point) => [point.code, point])).values(),
    );
    const orderedDestinations = await this.orderDestinations(
      hub,
      uniqueDestinations,
    );
    const routePoints = [hub, ...orderedDestinations, hub];
    const route = await this.requestRoute(routePoints);
    const radialLegs = await Promise.all(
      uniqueDestinations.map(async (destination) => ({
        code: destination.code,
        leg: await this.requestRoute([hub, destination]),
      })),
    );

    return {
      stopOrder: routePoints.map(({ code }) => code),
      orderedDestinations,
      routeGeometry: route.geometry,
      totalDistanceKm: route.distanceKm,
      distanceFromHubKm: Object.fromEntries(
        radialLegs.map(({ code, leg }) => [code, leg.distanceKm]),
      ),
      source:
        route.source === 'fallback' ||
        radialLegs.some(({ leg }) => leg.source === 'fallback')
          ? 'fallback'
          : 'ors',
    };
  }

  private async orderDestinations(
    hub: RoutingPoint,
    destinations: RoutingPoint[],
  ): Promise<RoutingPoint[]> {
    const points = [hub, ...destinations];

    try {
      const { data } = await axios.post<OrsMatrixResponse>(
        `${ORS_BASE_URL}/matrix/${ORS_PROFILE}`,
        {
          locations: points.map(coordinateOf),
          metrics: ['distance'],
          units: 'km',
        },
        orsRequestConfig,
      );
      const distances = data.distances;
      if (
        distances.length !== points.length ||
        distances.some(
          (row) =>
            row.length !== points.length ||
            row.some(
              (distance) => distance === null || !Number.isFinite(distance),
            ),
        )
      ) {
        throw new Error('ORS returned an incomplete distance matrix');
      }

      return orderByOptimalRoundTrip(
        hub,
        destinations,
        distances as number[][],
      );
    } catch (error: unknown) {
      this.logger.warn(
        `ORS matrix request failed; optimizing by straight-line distance (${describeError(error)})`,
      );
      return orderByOptimalRoundTrip(hub, destinations);
    }
  }

  private async requestRoute(points: RoutingPoint[]): Promise<RouteLeg> {
    const coordinates = points.map(coordinateOf);

    try {
      const { data } = await axios.post<OrsGeoJsonResponse>(
        `${ORS_BASE_URL}/directions/${ORS_PROFILE}/geojson`,
        { coordinates },
        orsRequestConfig,
      );
      const feature = data.features[0];
      if (!feature) {
        throw new Error('ORS returned no route feature');
      }

      return {
        geometry: feature.geometry,
        distanceKm: roundKilometres(feature.properties.summary.distance / 1000),
        source: 'ors',
      };
    } catch (error: unknown) {
      this.logger.warn(
        `ORS request failed; using fallback (${describeError(error)})`,
      );

      const straightLineDistance = points
        .slice(1)
        .reduce(
          (sum, point, index) =>
            sum + haversineDistanceKm(points[index], point),
          0,
        );

      return {
        geometry: { type: 'LineString', coordinates },
        distanceKm: roundKilometres(
          straightLineDistance * STRAIGHT_LINE_DETOUR_FACTOR,
        ),
        source: 'fallback',
      };
    }
  }
}
