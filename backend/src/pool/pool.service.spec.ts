import { calculatePoolStatus } from './pool.service';

describe('calculatePoolStatus', () => {
  it('is not ready below the threshold', () => {
    expect(calculatePoolStatus([80, 120, 60, 95, 110])).toEqual({
      totalWeightKg: 465,
      ordersCount: 5,
      thresholdKg: 500,
      isReady: false,
    });
  });

  it('becomes ready when the threshold is crossed', () => {
    expect(calculatePoolStatus([80, 120, 60, 95, 110, 55])).toEqual({
      totalWeightKg: 520,
      ordersCount: 6,
      thresholdKg: 500,
      isReady: true,
    });
  });
});
