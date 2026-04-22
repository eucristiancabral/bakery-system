import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CaixasService } from './caixas.service';

@Controller('caixas')
export class CaixasController {
  constructor(private readonly caixasService: CaixasService) {}

  @Get('status/:usuario_id')
  status(@Param('usuario_id') usuario_id: string) {
    return this.caixasService.verificarCaixaAberto(+usuario_id);
  }

  @Post('abrir')
  abrir(@Body() body: { usuario_id: number; valor_abertura: number }) {
    return this.caixasService.abrirCaixa(body.usuario_id, body.valor_abertura);
  }

  @Post('fechar')
  fechar(@Body() body: { caixa_id: number; valor_fechamento_informado: number }) {
    return this.caixasService.fecharCaixa(body.caixa_id, body.valor_fechamento_informado);
  }
}