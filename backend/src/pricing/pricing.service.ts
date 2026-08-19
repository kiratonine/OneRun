import { Injectable } from '@nestjs/common';
import { COST_PER_KM_KZT } from '../config/constants';

export interface PricingOrderInput {
  orderId: string;
  weightKg: number;
  legDistanceKm: number;
  dropIndex: number;
}

export interface PricedOrder extends PricingOrderInput {
  loadPosition: number;
  priceKzt: number;
}

export interface PricingResult {
  orders: PricedOrder[];
  totalCostKzt: number;
  soloDistanceKm: number;
  savedDistanceKm: number;
  savedCostKzt: number;
}

@Injectable()
export class PricingService {
  calculate(
    totalDistanceKm: number,
    orders: PricingOrderInput[],
  ): PricingResult {
    const totalCostKzt = Math.round(totalDistanceKm * COST_PER_KM_KZT);
    const tonneKilometres = orders.map(
      ({ weightKg, legDistanceKm }) => (weightKg / 1000) * legDistanceKm,
    );
    const totalTonneKilometres = tonneKilometres.reduce(
      (sum, value) => sum + value,
      0,
    );
    const lastDropIndex = Math.max(
      0,
      ...orders.map(({ dropIndex }) => dropIndex),
    );
    let allocatedCost = 0;

    const pricedOrders = orders.map((order, index) => {
      const isLast = index === orders.length - 1;
      const priceKzt = isLast
        ? totalCostKzt - allocatedCost
        : Math.round(
            totalCostKzt * (tonneKilometres[index] / totalTonneKilometres),
          );
      allocatedCost += priceKzt;

      return {
        ...order,
        loadPosition: lastDropIndex - order.dropIndex + 1,
        priceKzt,
      };
    });
    const soloDistanceKm = orders.reduce(
      (sum, { legDistanceKm }) => sum + legDistanceKm * 2,
      0,
    );
    const savedDistanceKm = soloDistanceKm - totalDistanceKm;

    return {
      orders: pricedOrders,
      totalCostKzt,
      soloDistanceKm: this.round(soloDistanceKm),
      savedDistanceKm: this.round(savedDistanceKm),
      savedCostKzt: Math.round(savedDistanceKm * COST_PER_KM_KZT),
    };
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
