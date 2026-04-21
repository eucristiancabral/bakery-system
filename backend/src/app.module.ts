import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { StockModule } from './stock/stock.module';
import { AuthModule } from './auth/auth.module';   // <-- AQUI
import { UsersModule } from './users/users.module'; // <-- AQUI
import { Usuario } from './users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root', // Ajuste aqui
      password: '123456', // Ajuste aqui
      database: 'padaria_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}', Usuario], // Garanta que a entidade Usuario seja lida
      synchronize: true,
    }),
    ProductsModule,
    SalesModule,
    StockModule,
    AuthModule,  // <-- AQUI
    UsersModule, // <-- AQUI
  ],
})
export class AppModule {}