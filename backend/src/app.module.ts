import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module';
import { StockModule } from './stock/stock.module';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root', // Ajuste aqui
      password: '123456', // Ajuste aqui
      database: 'padaria_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // Nunca use true em produção, mas como já criamos o banco manualmente, deixaremos false
    }),
    ProductsModule,
    StockModule,
    SalesModule,
  ],
})
export class AppModule {}