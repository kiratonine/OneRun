import { Injectable } from '@nestjs/common';
import { ReportResult, TripSummaryDto } from './dto/trip-summary.dto';

@Injectable()
export class ReportService {
  async generate(summary: TripSummaryDto): Promise<ReportResult> {
    return {
      contentMd: `## Отчёт по рейсу ${summary.tripCode}\n\n_Заглушка. Заменяется бэкендом-2._`,
      raw: null,
      source: 'mock',
    };
  }
}
