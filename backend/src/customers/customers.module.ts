import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from './entities/customer.entity';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente])],
  providers: [CustomersService],
  controllers: [CustomersController],
  exports: [CustomersService], // Exportamos para o SalesService usar
})
export class CustomersModule {}