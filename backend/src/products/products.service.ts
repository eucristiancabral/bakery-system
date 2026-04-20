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

  async findAll() {
      // Certifique-se de que NÃO existe um "where: { ativo: true }" aqui
      return this.dataSource.getRepository(Product).find({
      relations: ['stock'] 
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  async update(id: number, updateData: any) {
    await this.dataSource.getRepository(Product).update(id, updateData);
    return this.findOne(id);
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}