import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule, // Importamos o módulo de usuários para poder checar o e-mail
    JwtModule.register({
      secret: 'CHAVE_SECRETA_PADARIA_123', // Em produção real, você colocará isso num arquivo .env
      signOptions: { expiresIn: '8h' }, // O token do caixa expira a cada 8 horas de turno
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}