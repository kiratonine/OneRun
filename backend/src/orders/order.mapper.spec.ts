import { mapOrder } from './order.mapper';

describe('mapOrder', () => {
  it('returns nested settlements and camelCase fields', () => {
    const settlement = {
      id: 1,
      code: 'AKTAU',
      name_ru: 'Актау',
      name_kz: 'Ақтау',
      district: null,
      lat: 43.63,
      lon: 51.16,
    };

    const result = mapOrder({
      id: 'order-id',
      code: 'ORD-001',
      from: settlement,
      to: { ...settlement, id: 2, code: 'SHETPE', name_ru: 'Шетпе' },
      shipper_name: 'ИП Дәулет',
      cargo_name: 'Стройматериалы',
      weight_kg: 120,
      boxes_count: 6,
      box_note: null,
      color: '#ef4444',
      status: 'new',
      created_at: '2026-08-19T10:00:00.000Z',
    });

    expect(result.code).toBe('ORD-001');
    expect(result.from.nameRu).toBe('Актау');
    expect(result.to.code).toBe('SHETPE');
    expect(result.weightKg).toBe(120);
    expect(result.createdAt).toBe('2026-08-19T10:00:00.000Z');
  });
});
