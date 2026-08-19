import { Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { OrderResponse } from '../orders/order.types';
import { DemoService } from './demo.service';

@Controller('demo')
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Post('seed')
  async seedNext(
    @Res({ passthrough: true }) response: Response,
  ): Promise<OrderResponse | undefined> {
    const order = await this.demoService.seedNext();
    if (!order) {
      response.status(204);
      return undefined;
    }

    return order;
  }

  @Post('reset')
  reset(): Promise<{ ok: true }> {
    return this.demoService.reset();
  }
}
