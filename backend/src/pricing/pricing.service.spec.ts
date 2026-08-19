import { COST_PER_KM_KZT } from '../config/constants';
import { PricingService } from './pricing.service';

describe('PricingService', () => {
  const service = new PricingService();

  it('allocates the full trip cost and preserves LIFO positions', () => {
    const result = service.calculate(812, [
      { orderId: 'near', weightKg: 80, legDistanceKm: 40, dropIndex: 1 },
      { orderId: 'far', weightKg: 140, legDistanceKm: 500, dropIndex: 2 },
    ]);

    expect(result.orders.reduce((sum, order) => sum + order.priceKzt, 0)).toBe(
      Math.round(812 * COST_PER_KM_KZT),
    );
    expect(result.orders.map(({ loadPosition }) => loadPosition)).toEqual([
      2, 1,
    ]);
    expect(result.orders[1].priceKzt).toBeGreaterThan(
      result.orders[0].priceKzt,
    );
  });

  it('calculates solo distance and savings from radial legs', () => {
    const result = service.calculate(100, [
      { orderId: 'one', weightKg: 100, legDistanceKm: 50, dropIndex: 1 },
      { orderId: 'two', weightKg: 100, legDistanceKm: 75, dropIndex: 2 },
    ]);

    expect(result.soloDistanceKm).toBe(250);
    expect(result.savedDistanceKm).toBe(150);
    expect(result.savedCostKzt).toBe(Math.round(150 * COST_PER_KM_KZT));
  });
});
