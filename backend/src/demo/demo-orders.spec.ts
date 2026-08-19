import { POOL_WEIGHT_THRESHOLD_KG } from '../config/constants';
import { DEMO_ORDERS } from './demo-orders';

describe('DEMO_ORDERS', () => {
  it('crosses the pool threshold only on the sixth order and totals 520 kg', () => {
    const firstFiveWeight = DEMO_ORDERS.slice(0, 5).reduce(
      (sum, order) => sum + order.weightKg,
      0,
    );
    const totalWeight = DEMO_ORDERS.reduce(
      (sum, order) => sum + order.weightKg,
      0,
    );

    expect(DEMO_ORDERS).toHaveLength(6);
    expect(firstFiveWeight).toBeLessThan(POOL_WEIGHT_THRESHOLD_KG);
    expect(totalWeight).toBe(520);
    expect(totalWeight).toBeGreaterThanOrEqual(POOL_WEIGHT_THRESHOLD_KG);
  });
});
