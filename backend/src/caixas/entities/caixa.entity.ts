import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('caixas')
export class Caixa {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  usuario_id!: number; // Quem abriu o caixa (O ID do funcionário)

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor_abertura!: number; // O "Fundo de Troco" que fica na gaveta

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_fechamento_informado!: number; // Quanto o funcionário contou na gaveta no final

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valor_fechamento_calculado!: number; // Quanto o sistema diz que deveria ter (Abertura + Vendas)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  diferenca!: number; // Se faltou ou sobrou dinheiro (Quebra de caixa)

  @Column({ type: 'varchar', length: 20, default: 'ABERTO' })
  status!: string; // 'ABERTO' ou 'FECHADO'

  @CreateDateColumn()
  criado_em!: Date; // Hora que o turno começou

  @Column({ type: 'datetime', nullable: true })
  fechado_em!: Date; // Hora que o turno terminou
}