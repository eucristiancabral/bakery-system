import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './entities/product.entity';
import { Stock } from './entities/stock.entity';

@Injectable()
export class ProductsService {
  // Injetamos o DataSource para ter controle total sobre transações manuais
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async create(createProductDto: CreateProductDto) {
    // Iniciamos um bloco de transação. O 'manager' gerencia as operações seguras.
    return this.dataSource.transaction(async (manager) => {
      try {
        // 1. Prepara e salva o Produto
        const product = manager.create(Product, {
          nome: createProductDto.nome,
          codigo_barras: createProductDto.codigo_barras,
          preco_venda: createProductDto.preco_venda,
          custo: createProductDto.custo,
          ativo: true,
        });
        
        const savedProduct = await manager.save(product);

        // 2. Prepara e salva o Estoque inicial (quantidade 0) atrelado ao ID do produto
        const stock = manager.create(Stock, {
          produto_id: savedProduct.id,
          quantidade: 0,
        });

        await manager.save(stock);

        // Se chegou até aqui, o NestJS faz o COMMIT automático no MySQL
        return savedProduct;
        
      } catch (error) {
        // Garantimos que, se for um erro padrão, pegamos a mensagem. Se não, convertemos para string.
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new InternalServerErrorException(`Erro ao salvar produto e estoque: ${errorMessage}`);
      }
    });
  }

  // Os demais métodos gerados pelo NestJS podem ficar como estão por enquanto
  // Adicione isso abaixo do seu método 'create' no products.service.ts
  async findAll() {
    return this.dataSource.getRepository(Product).find({
      where: { ativo: true }, // Trazemos apenas o que pode ser vendido
      relations: ['stock'], // Faz o JOIN automático com a tabela de estoque
      select: {
        id: true,
        nome: true,
        preco_venda: true,
        codigo_barras: true,
        // Não enviamos o 'custo' para o frontend do PDV por segurança (o caixa não precisa saber)
      }
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: any) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}