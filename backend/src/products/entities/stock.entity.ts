import { Entity, Column, PrimaryColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('estoque')
export class Stock {
  @PrimaryColumn()
  produto_id!: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  quantidade!: number;

  @UpdateDateColumn()
  atualizado_em!: Date;

  @OneToOne(() => Product, (product) => product.stock)
  @JoinColumn({ name: 'produto_id' })
  product!: Product;
}
