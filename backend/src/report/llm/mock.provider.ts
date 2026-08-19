import { Injectable } from '@nestjs/common';
import { ReportResult, TripSummaryDto } from '../dto/trip-summary.dto';
import { buildFallbackReport } from '../templates/fallback-report';
import { LlmProvider } from './llm.provider';

@Injectable()
export class MockProvider implements LlmProvider {
  async generate(summary: TripSummaryDto): Promise<ReportResult> {
    return {
      contentMd: buildFallbackReport(summary),
      raw: null,
      source: 'mock',
    };
  }
}
