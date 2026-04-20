import { Controller, Post, Body } from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateStockDto } from './dto/create-stock.dto';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('entrada')
  addStock(@Body() createStockDto: CreateStockDto) {
    return this.stockService.addStock(createStockDto);
  }
}