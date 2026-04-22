import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaixasService } from './caixas.service';
import { CaixasController } from './caixas.controller';
import { Caixa } from './entities/caixa.entity';
import { Venda } from '../sales/entities/venda.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Caixa, Venda])], // O módulo precisa conhecer o banco de Caixas e Vendas
  controllers: [CaixasController],
  providers: [CaixasService],
})
export class CaixasModule {}