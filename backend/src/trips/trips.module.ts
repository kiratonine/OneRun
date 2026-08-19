import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { PricingModule } from '../pricing/pricing.module';
import { ReportModule } from '../report/report.module';
import { RoutingModule } from '../routing/routing.module';
import { SettlementsModule } from '../settlements/settlements.module';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';

@Module({
  imports: [
    OrdersModule,
    SettlementsModule,
    RoutingModule,
    PricingModule,
    ReportModule,
  ],
  controllers: [TripsController],
  providers: [TripsService],
})
export class TripsModule {}
