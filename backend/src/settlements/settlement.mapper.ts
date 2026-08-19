import { SettlementResponse, SettlementRow } from './settlement.types';

export function mapSettlement(row: SettlementRow): SettlementResponse {
  return {
    id: row.id,
    code: row.code,
    nameRu: row.name_ru,
    nameKz: row.name_kz,
    district: row.district,
    lat: Number(row.lat),
    lon: Number(row.lon),
  };
}
