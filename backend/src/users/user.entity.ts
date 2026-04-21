import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  senha: string; // Esta senha será salva como um "hash" seguro

  @Column({ default: 'CAIXA' }) // Perfis: 'ADMIN' ou 'CAIXA'
  perfil: string;

  @Column({ default: true })
  ativo: boolean;
}
