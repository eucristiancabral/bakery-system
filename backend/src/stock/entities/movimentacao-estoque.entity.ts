import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity'; // Importa a entidade do outro módulo

export enum TipoMovimento {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA',
}

export enum MotivoMovimento {
  PRODUCAO = 'PRODUCAO',
  COMPRA = 'COMPRA',
  VENDA = 'VENDA',
  AJUSTE = 'AJUSTE',
  PERDA = 'PERDA',
}

@Entity('movimentacoes_estoque')
export class MovimentacaoEstoque {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  produto_id!: number;

  @Column({ type: 'enum', enum: TipoMovimento })
  tipo_movimento!: TipoMovimento;

  @Column({ type: 'enum', enum: MotivoMovimento })
  motivo!: MotivoMovimento;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantidade!: number;

  @Column({ nullable: true })
  referencia_id!: number; // ID da Venda, se o motivo for VENDA

  @CreateDateColumn()
  criado_em!: Date;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'produto_id' })
  product!: Product;
}