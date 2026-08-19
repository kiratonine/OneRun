import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  COST_PER_KM_KZT,
  HUB_SETTLEMENT_CODE,
  POOL_WEIGHT_THRESHOLD_KG,
} from '../config/constants';
import { OrderResponse } from '../orders/order.types';
import { OrdersService } from '../orders/orders.service';
import { PricingService } from '../pricing/pricing.service';
import { ReportService } from '../report/report.service';
import { RoutingPoint } from '../routing/routing.types';
import { RoutingService } from '../routing/routing.service';
import { SettlementsService } from '../settlements/settlements.service';
import { SupabaseService } from '../supabase/supabase.service';
import { mapTrip } from './trip.mapper';
import { ReportRow, TripOrderRow, TripResponse, TripRow } from './trip.types';

@Injectable()
export class TripsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly ordersService: OrdersService,
    private readonly settlementsService: SettlementsService,
    private readonly routingService: RoutingService,
    private readonly pricingService: PricingService,
    private readonly reportService: ReportService,
  ) {}

  async create(): Promise<TripResponse> {
    const orders = await this.ordersService.findNew();
    if (orders.length === 0) {
      throw new BadRequestException('No new orders to route');
    }

    const totalWeightKg = orders.reduce(
      (sum, order) => sum + order.weightKg,
      0,
    );
    if (totalWeightKg < POOL_WEIGHT_THRESHOLD_KG) {
      throw new BadRequestException(
        `Pool weight ${totalWeightKg} kg is below ${POOL_WEIGHT_THRESHOLD_KG} kg`,
      );
    }

    const hubSettlement =
      await this.settlementsService.findByCode(HUB_SETTLEMENT_CODE);
    const hub = this.toRoutingPoint(hubSettlement);
    const route = await this.routingService.buildRoute(
      hub,
      orders.map((order) => ({
        ...this.toRoutingPoint(order.to),
        deliveryWeightKg: order.weightKg,
      })),
    );
    const pricing = this.pricingService.calculate(
      route.totalDistanceKm,
      orders.map((order) => ({
        orderId: order.id,
        weightKg: order.weightKg,
        legDistanceKm: route.distanceFromHubKm[order.to.code],
        dropIndex:
          route.orderedDestinations.findIndex(
            ({ code }) => code === order.to.code,
          ) + 1,
      })),
    );
    const tripNumber = (await this.countTrips()) + 1;
    const tripId = randomUUID();
    const tripCode = `TRIP-${String(tripNumber).padStart(3, '0')}`;
    const pricedByOrderId = new Map(
      pricing.orders.map((order) => [order.orderId, order]),
    );
    const report = await this.reportService.generate({
      tripCode,
      hubName: hub.nameRu,
      stopOrder: [
        hub.nameRu,
        ...route.orderedDestinations.map(({ nameRu }) => nameRu),
        hub.nameRu,
      ],
      totalDistanceKm: route.totalDistanceKm,
      soloDistanceKm: pricing.soloDistanceKm,
      savedDistanceKm: pricing.savedDistanceKm,
      savedCostKzt: pricing.savedCostKzt,
      totalWeightKg,
      costPerKmKzt: COST_PER_KM_KZT,
      orders: orders.map((order) => {
        const priced = this.requirePrice(pricedByOrderId, order);
        return {
          code: order.code,
          shipperName: order.shipperName,
          toName: order.to.nameRu,
          cargoName: order.cargoName,
          weightKg: order.weightKg,
          boxesCount: order.boxesCount,
          boxNote: order.boxNote,
          dropIndex: priced.dropIndex,
          loadPosition: priced.loadPosition,
          priceKzt: priced.priceKzt,
          legDistanceKm: priced.legDistanceKm,
        };
      }),
    });

    const { error } = await this.supabase.client.rpc('persist_trip', {
      p_trip: {
        id: tripId,
        code: tripCode,
        stop_order: route.stopOrder,
        route_geometry: route.routeGeometry,
        total_distance_km: route.totalDistanceKm,
        solo_distance_km: pricing.soloDistanceKm,
        saved_distance_km: pricing.savedDistanceKm,
        saved_cost_kzt: pricing.savedCostKzt,
        total_weight_kg: totalWeightKg,
      },
      p_trip_orders: pricing.orders.map((order) => ({
        trip_id: tripId,
        order_id: order.orderId,
        price_kzt: order.priceKzt,
        load_position: order.loadPosition,
        drop_index: order.dropIndex,
        leg_distance_km: order.legDistanceKm,
      })),
      p_report: {
        trip_id: tripId,
        content_md: report.contentMd,
        raw_response: report.raw,
        source: report.source,
      },
      p_order_ids: orders.map(({ id }) => id),
    });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return this.findById(tripId);
  }

  async findById(id: string): Promise<TripResponse> {
    const { data: tripData, error: tripError } = await this.supabase.client
      .from('trips')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (tripError) {
      throw new InternalServerErrorException(tripError.message);
    }
    if (!tripData) {
      throw new NotFoundException(`Trip ${id} not found`);
    }

    const [tripOrdersResult, reportResult] = await Promise.all([
      this.supabase.client
        .from('trip_orders')
        .select(
          'price_kzt, load_position, drop_index, leg_distance_km, order:orders!trip_orders_order_id_fkey(code)',
        )
        .eq('trip_id', id)
        .order('drop_index'),
      this.supabase.client
        .from('reports')
        .select('content_md, source')
        .eq('trip_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (tripOrdersResult.error) {
      throw new InternalServerErrorException(tripOrdersResult.error.message);
    }
    if (reportResult.error) {
      throw new InternalServerErrorException(reportResult.error.message);
    }

    return mapTrip(
      tripData as TripRow,
      (tripOrdersResult.data ?? []) as unknown as TripOrderRow[],
      reportResult.data as ReportRow | null,
    );
  }

  private async countTrips(): Promise<number> {
    const { count, error } = await this.supabase.client
      .from('trips')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return count ?? 0;
  }

  private toRoutingPoint(settlement: OrderResponse['to']): RoutingPoint {
    return {
      code: settlement.code,
      nameRu: settlement.nameRu,
      lat: settlement.lat,
      lon: settlement.lon,
    };
  }

  private requirePrice(
    prices: Map<
      string,
      ReturnType<PricingService['calculate']>['orders'][number]
    >,
    order: OrderResponse,
  ): ReturnType<PricingService['calculate']>['orders'][number] {
    const priced = prices.get(order.id);
    if (!priced) {
      throw new InternalServerErrorException(
        `Pricing result for order ${order.code} is missing`,
      );
    }
    return priced;
  }
}
