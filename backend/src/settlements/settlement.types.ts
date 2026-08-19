export interface SettlementRow {
  id: number;
  code: string;
  name_ru: string;
  name_kz: string | null;
  district: string | null;
  lat: number;
  lon: number;
}

export interface SettlementResponse {
  id: number;
  code: string;
  nameRu: string;
  nameKz: string | null;
  district: string | null;
  lat: number;
  lon: number;
}
