import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Venda } from './entities/venda.entity';
import { ItemVenda } from './entities/item-venda.entity';
import { Product } from '../products/entities/product.entity';
import { Stock } from '../products/entities/stock.entity';
import { MovimentacaoEstoque, TipoMovimento, MotivoMovimento } from '../stock/entities/movimentacao-estoque.entity';
// IMPORTANTE: Importar o serviço de clientes
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class SalesService {
  // Adicionamos o CustomersService no construtor
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private readonly customersService: CustomersService,
  ) {}

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
            preco_unitario: Number(produto.preco_venda),
            subtotal: subtotal,
          });
        }

        // 3. Salvar o Cabeçalho da Venda (Agora com cliente_id)
        const novaVenda = manager.create(Venda, {
          total: valorTotalVenda,
          forma_pagamento: createSaleDto.forma_pagamento,
          caixa_id: createSaleDto.caixa_id,
          cliente_id: createSaleDto.cliente_id, // <-- VINCULA O CLIENTE AQUI!
        });
        const vendaSalva = await manager.save(novaVenda);

        // 4. LÓGICA DO FIADO: Se for fiado, aumenta a dívida do cliente
        if (createSaleDto.forma_pagamento === 'FIADO') {
          if (!createSaleDto.cliente_id) {
            throw new BadRequestException('Para vendas no FIADO, é obrigatório selecionar um cliente.');
          }
          // Chamamos o serviço de cliente para atualizar o saldo
          await this.customersService.atualizarSaldo(createSaleDto.cliente_id, valorTotalVenda);
        }

        // 5. Salvar Itens, Baixar Estoque e Registrar Auditoria
        for (const item of itensProcessados) {
          
          // 5.1 Salvar Item da Venda
          const novoItemVenda = manager.create(ItemVenda, {
            venda_id: vendaSalva.id,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            subtotal: item.subtotal,
          });
          await manager.save(novoItemVenda);

          // 5.2 Baixar Estoque Atual
          const estoque = await manager.findOne(Stock, { where: { produto_id: item.produto_id } });
          if (estoque) {
            estoque.quantidade = Number(estoque.quantidade) - Number(item.quantidade);
            await manager.save(estoque);
          }

          // 5.3 Registrar Histórico de Movimentação
          const movimentacao = manager.create(MovimentacaoEstoque, {
            produto_id: item.produto_id,
            tipo_movimento: TipoMovimento.SAIDA,
            motivo: MotivoMovimento.VENDA,
            quantidade: item.quantidade,
            referencia_id: vendaSalva.id,
          });
          await manager.save(movimentacao);
        }

        return {
          mensagem: 'Venda finalizada com sucesso!',
          venda_id: vendaSalva.id,
          total: valorTotalVenda
        };

      } catch (error) {
        if (error instanceof NotFoundException || error instanceof BadRequestException) {
          throw error;
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new InternalServerErrorException(`Erro crítico ao processar venda: ${errorMessage}`);
      }
    });
  }

  async findAll() {
    return this.dataSource.getRepository(Venda).find({
      relations: ['itens', 'itens.produto'],
      order: { criado_em: 'DESC' }
    });
  }
}