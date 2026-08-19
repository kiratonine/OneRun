import { Module } from '@nestjs/common';
import { GeminiProvider } from './llm/gemini.provider';
import { MockProvider } from './llm/mock.provider';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  controllers: [ReportController],
  providers: [ReportService, MockProvider, GeminiProvider],
  exports: [ReportService],
})
export class ReportModule {}
