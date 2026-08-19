import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateOrderDto, OrderResponse } from './order.types';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(): Promise<OrderResponse[]> {
    return this.ordersService.findAll();
  }

  @Post()
  create(@Body() input: CreateOrderDto): Promise<OrderResponse> {
    return this.ordersService.create(input);
  }
}
