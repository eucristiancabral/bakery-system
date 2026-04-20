import { MotivoMovimento } from '../entities/movimentacao-estoque.entity';

export class CreateStockDto {
  produto_id!: number;
  quantidade!: number;
  motivo!: MotivoMovimento; // PRODUCAO ou COMPRA
}