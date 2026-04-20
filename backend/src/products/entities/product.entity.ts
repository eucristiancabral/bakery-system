import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { Stock } from './stock.entity';

@Entity('produtos')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  codigo_barras!: string;

  @Column()
  nome!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  preco_venda!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  custo!: number;

  @Column({ default: true })
  ativo!: boolean;

  @CreateDateColumn()
  criado_em!: Date;

  @UpdateDateColumn()
  atualizado_em!: Date;

  @OneToOne(() => Stock, (stock) => stock.product)
  stock!: Stock;
}