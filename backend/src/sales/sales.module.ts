import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { Venda } from './entities/venda.entity';
import { ItemVenda } from './entities/item-venda.entity';
import { Product } from '../products/entities/product.entity';
import { Stock } from '../products/entities/stock.entity';
import { MovimentacaoEstoque } from '../stock/entities/movimentacao-estoque.entity';

@Module({
  // Injetamos todas as 5 tabelas que a transação de venda vai precisar manipular!
  imports: [TypeOrmModule.forFeature([Venda, ItemVenda, Product, Stock, MovimentacaoEstoque])],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}