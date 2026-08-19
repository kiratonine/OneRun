import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { DemoController } from './demo.controller';
import { DemoService } from './demo.service';

@Module({
  imports: [OrdersModule],
  controllers: [DemoController],
  providers: [DemoService],
})
export class DemoModule {}
