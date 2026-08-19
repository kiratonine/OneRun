import { Controller, Get } from '@nestjs/common';
import { SettlementResponse } from './settlement.types';
import { SettlementsService } from './settlements.service';

@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Get()
  findAll(): Promise<SettlementResponse[]> {
    return this.settlementsService.findAll();
  }
}
