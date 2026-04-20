import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { Stock } from './entities/stock.entity';

@Module({
  // Aqui nós "injetamos" as entidades para este módulo
  imports: [TypeOrmModule.forFeature([Product, Stock])], 
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}