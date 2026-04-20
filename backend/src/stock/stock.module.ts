import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { MovimentacaoEstoque } from './entities/movimentacao-estoque.entity';
import { Stock } from '../products/entities/stock.entity'; // Importamos o saldo do outro módulo

@Module({
  imports: [TypeOrmModule.forFeature([MovimentacaoEstoque, Stock])],
  controllers: [StockController],
  providers: [StockService],
})
export class StockModule {}