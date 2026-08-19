import { Controller, Get, Param, Post } from '@nestjs/common';
import { TripResponse } from './trip.types';
import { TripsService } from './trips.service';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  create(): Promise<TripResponse> {
    return this.tripsService.create();
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<TripResponse> {
    return this.tripsService.findById(id);
  }
}
