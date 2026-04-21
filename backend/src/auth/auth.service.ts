import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt'; 

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validarUsuario(email: string, senhaDigitada: string) {
    const usuario = await this.usersService.buscarPorEmail(email);

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Acesso negado ou usuário inativo.');
    }

    const senhaValida = await bcrypt.compare(senhaDigitada, usuario.senha);

    if (!senhaValida) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const payload = { sub: usuario.id, email: usuario.email, perfil: usuario.perfil };
    
    return {
      access_token: this.jwtService.sign(payload),
      perfil: usuario.perfil
    };
  }
}