import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Venda } from './venda.entity';
import { Product } from '../../products/entities/product.entity'; // Importa lá do módulo de produtos

@Entity('itens_venda')
export class ItemVenda {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  venda_id!: number;

  @Column()
  produto_id!: number;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantidade!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  preco_unitario!: number; // Congelamento de preço!

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal!: number;

  // Relacionamento: Muitos Itens pertencem a Uma Venda
  @ManyToOne(() => Venda, (venda) => venda.itens)
  @JoinColumn({ name: 'venda_id' })
  venda!: Venda;

  // Relacionamento: Esse item aponta para um Produto específico
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'produto_id' })
  produto!: Product;
}