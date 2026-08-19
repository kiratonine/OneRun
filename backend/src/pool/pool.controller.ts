import { Controller, Get } from '@nestjs/common';
import { PoolService, PoolStatus } from './pool.service';

@Controller('pool')
export class PoolController {
  constructor(private readonly poolService: PoolService) {}

  @Get()
  getStatus(): Promise<PoolStatus> {
    return this.poolService.getStatus();
  }
}
