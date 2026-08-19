import { Controller, Get } from '@nestjs/common';
import { ReportService, ReportStatus } from './report.service';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('status')
  status(): ReportStatus {
    return this.reportService.status();
  }
}
