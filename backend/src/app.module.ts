import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { StockModule } from './stock/stock.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { Usuario } from './users/user.entity';
import { Caixa } from './caixas/entities/caixa.entity';
import { CaixasModule } from './caixas/caixas.module';
import { Cliente } from './customers/entities/customer.entity';
import { CustomersModule } from './customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root', 
      password: '123456', 
      database: 'padaria_db',
      // Adicionamos as novas entidades aqui para o TypeORM gerenciar as tabelas
      entities: [__dirname + '/**/*.entity{.ts,.js}', Usuario, Caixa, Cliente], 
      synchronize: true,
    }),
    ProductsModule,
    SalesModule,
    StockModule,
    AuthModule,  
    UsersModule,
    CaixasModule,
    CustomersModule, // <-- ADICIONADO AQUI
  ],
})
export class AppModule {}