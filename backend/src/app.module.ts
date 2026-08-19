import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { DemoModule } from './demo/demo.module';
import { OrdersModule } from './orders/orders.module';
import { PoolModule } from './pool/pool.module';
import { PricingModule } from './pricing/pricing.module';
import { ReportModule } from './report/report.module';
import { RoutingModule } from './routing/routing.module';
import { SettlementsModule } from './settlements/settlements.module';
import { SupabaseModule } from './supabase/supabase.module';
import { TripsModule } from './trips/trips.module';

@Module({
  imports: [
    SupabaseModule,
    ReportModule,
    SettlementsModule,
    OrdersModule,
    PoolModule,
    DemoModule,
    RoutingModule,
    PricingModule,
    TripsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
