import { mapSettlement } from './settlement.mapper';

describe('mapSettlement', () => {
  it('maps database fields to the camelCase API contract', () => {
    expect(
      mapSettlement({
        id: 1,
        code: 'AKTAU',
        name_ru: 'Актау',
        name_kz: 'Ақтау',
        district: null,
        lat: 43.6353364,
        lon: 51.168222,
      }),
    ).toEqual({
      id: 1,
      code: 'AKTAU',
      nameRu: 'Актау',
      nameKz: 'Ақтау',
      district: null,
      lat: 43.6353364,
      lon: 51.168222,
    });
  });
});
