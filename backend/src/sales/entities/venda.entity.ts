import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { ItemVenda } from './item-venda.entity';

export enum FormaPagamento {
  PIX = 'PIX',
  DINHEIRO = 'DINHEIRO',
  CARTAO_CREDITO = 'CARTAO_CREDITO',
  CARTAO_DEBITO = 'CARTAO_DEBITO',
}

export enum StatusVenda {
  CONCLUIDA = 'CONCLUIDA',
  CANCELADA = 'CANCELADA',
}

@Entity('vendas')
export class Venda {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total!: number;

  @Column({ type: 'enum', enum: FormaPagamento })
  forma_pagamento!: FormaPagamento;

  @Column({ type: 'enum', enum: StatusVenda, default: StatusVenda.CONCLUIDA })
  status!: StatusVenda;

  @CreateDateColumn()
  criado_em!: Date;

  // Relacionamento: Uma Venda tem Muitos Itens
  @OneToMany(() => ItemVenda, (item) => item.venda)
  itens!: ItemVenda[];

  @Column({ nullable: true }) // Deixamos nullable por enquanto para não quebrar as vendas antigas que você já fez
  caixa_id!: number;
}