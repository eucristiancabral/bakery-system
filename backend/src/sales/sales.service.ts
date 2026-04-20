import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Venda } from './entities/venda.entity';
import { ItemVenda } from './entities/item-venda.entity';
import { Product } from '../products/entities/product.entity';
import { Stock } from '../products/entities/stock.entity';
import { MovimentacaoEstoque, TipoMovimento, MotivoMovimento } from '../stock/entities/movimentacao-estoque.entity';

@Injectable()
export class SalesService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async create(createSaleDto: CreateSaleDto) {
    // 1. Validação Básica
    if (!createSaleDto.itens || createSaleDto.itens.length === 0) {
      throw new BadRequestException('A venda não pode ser finalizada sem itens.');
    }

    return this.dataSource.transaction(async (manager) => {
      try {
        let valorTotalVenda = 0;
        const itensProcessados: Array<{
          produto_id: number;
          quantidade: number;
          preco_unitario: number;
          subtotal: number;
        }> = [];

        // 2. Cálculo Seguro e Verificação de Produtos
        for (const itemDto of createSaleDto.itens) {
          const produto = await manager.findOne(Product, { where: { id: itemDto.produto_id } });
          
          if (!produto) {
            throw new NotFoundException(`Produto com ID ${itemDto.produto_id} não existe.`);
          }
          if (!produto.ativo) {
            throw new BadRequestException(`O produto ${produto.nome} está inativo.`);
          }

          const subtotal = Number(produto.preco_venda) * Number(itemDto.quantidade);
          valorTotalVenda += subtotal;

          itensProcessados.push({
            produto_id: produto.id,
            quantidade: itemDto.quantidade,
            preco_unitario: produto.preco_venda, // Congelamos o preço oficial do banco
            subtotal: subtotal,
          });
        }

        // 3. Salvar o Cabeçalho da Venda
        const novaVenda = manager.create(Venda, {
          total: valorTotalVenda,
          forma_pagamento: createSaleDto.forma_pagamento,
        });
        const vendaSalva = await manager.save(novaVenda);

        // 4. Salvar Itens, Baixar Estoque e Registrar Auditoria
        for (const item of itensProcessados) {
          
          // 4.1 Salvar Item da Venda
          const novoItemVenda = manager.create(ItemVenda, {
            venda_id: vendaSalva.id,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            subtotal: item.subtotal,
          });
          await manager.save(novoItemVenda);

          // 4.2 Baixar Estoque Atual
          const estoque = await manager.findOne(Stock, { where: { produto_id: item.produto_id } });
          if (estoque) {
            estoque.quantidade = Number(estoque.quantidade) - Number(item.quantidade);
            await manager.save(estoque);
          }

          // 4.3 Registrar Histórico de Movimentação (Saída por Venda)
          const movimentacao = manager.create(MovimentacaoEstoque, {
            produto_id: item.produto_id,
            tipo_movimento: TipoMovimento.SAIDA,
            motivo: MotivoMovimento.VENDA,
            quantidade: item.quantidade,
            referencia_id: vendaSalva.id, // O ID da venda serve como "Nota Fiscal"
          });
          await manager.save(movimentacao);
        }

        // Se chegou até aqui, o TypeORM dá o COMMIT no MySQL!
        return {
          mensagem: 'Venda finalizada com sucesso!',
          venda_id: vendaSalva.id,
          total: valorTotalVenda
        };

      } catch (error) {
        // Se já for um erro HTTP tratado (NotFound ou BadRequest), nós o repassamos
        if (error instanceof NotFoundException || error instanceof BadRequestException) {
          throw error;
        }
        // Se for erro de banco, lançamos Erro Interno do Servidor (500)
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new InternalServerErrorException(`Erro crítico ao processar venda: ${errorMessage}`);
      }
    });
  }
  // Busca todas as vendas ordenadas da mais recente para a mais antiga
  async findAll() {
    return this.dataSource.getRepository(Venda).find({
      order: { criado_em: 'DESC' }
    });
  }
  // Os outros métodos (findAll, findOne, etc) podem ficar aqui embaixo intocados...
}