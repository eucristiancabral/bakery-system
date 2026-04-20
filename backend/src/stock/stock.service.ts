import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateStockDto } from './dto/create-stock.dto';
import { MovimentacaoEstoque, TipoMovimento } from './entities/movimentacao-estoque.entity';
import { Stock } from '../products/entities/stock.entity';

@Injectable()
export class StockService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async addStock(createStockDto: CreateStockDto) {
    return this.dataSource.transaction(async (manager) => {
      try {
        // 1. Busca o registro de saldo atual do produto
        const stock = await manager.findOne(Stock, { 
          where: { produto_id: createStockDto.produto_id } 
        });

        if (!stock) {
          throw new NotFoundException('Produto não encontrado no estoque.');
        }

        // 2. Atualiza a quantidade somando o valor novo
        // Usamos Number() para evitar que o JS concatene strings acidentalmente
        stock.quantidade = Number(stock.quantidade) + Number(createStockDto.quantidade);
        await manager.save(stock);

        // 3. Registra a movimentação de ENTRADA na auditoria
        const movimentacao = manager.create(MovimentacaoEstoque, {
          produto_id: createStockDto.produto_id,
          tipo_movimento: TipoMovimento.ENTRADA,
          motivo: createStockDto.motivo,
          quantidade: createStockDto.quantidade,
        });
        await manager.save(movimentacao);

        return { 
          mensagem: 'Entrada registrada com sucesso', 
          saldo_atual: stock.quantidade 
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new InternalServerErrorException(`Erro ao atualizar estoque: ${errorMessage}`);
      }
    });
  }

  // Mantenha os outros métodos gerados padrão (findAll, findOne, etc) aqui embaixo...
}