import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nome!: string;

  @Column({ nullable: true })
  telefone!: string;

  @Column({ nullable: true })
  cpf!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  limite_credito!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  saldo_devedor!: number; // O quanto ele deve atualmente

  @CreateDateColumn()
  criado_em!: Date;

  @UpdateDateColumn()
  atualizado_em!: Date;
}