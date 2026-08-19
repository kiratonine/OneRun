import { ReportResult, TripSummaryDto } from '../dto/trip-summary.dto';

export interface LlmProvider {
  generate(summary: TripSummaryDto): Promise<ReportResult>;
}
