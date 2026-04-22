import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { Venda } from './entities/venda.entity';
import { ItemVenda } from './entities/item-venda.entity';
import { Product } from '../products/entities/product.entity';
import { Stock } from '../products/entities/stock.entity';
import { CustomersModule } from '../customers/customers.module'; // <-- IMPORTAÇÃO DO MÓDULO

@Module({
  imports: [
    TypeOrmModule.forFeature([Venda, ItemVenda, Product, Stock]),
    CustomersModule, // <-- ADICIONE O MÓDULO AQUI NA LISTA DE IMPORTS
  ],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}