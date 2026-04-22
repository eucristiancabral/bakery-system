import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Caixa } from './entities/caixa.entity';
import { Venda } from '../sales/entities/venda.entity'; // Ajuste o caminho se necessário

@Injectable()
export class CaixasService {
  constructor(
    @InjectRepository(Caixa)
    private caixaRepository: Repository<Caixa>,
    
    @InjectRepository(Venda) // Precisamos da tabela de Vendas para fazer as contas!
    private vendaRepository: Repository<Venda>,
  ) {}

  // 1. VERIFICA SE ESTÁ ABERTO
  async verificarCaixaAberto(usuario_id: number) {
    const caixa = await this.caixaRepository.findOne({
      where: { usuario_id, status: 'ABERTO' }
    });
    return caixa || null;
  }

  // 2. ABRE O TURNO
  async abrirCaixa(usuario_id: number, valor_abertura: number) {
    const caixaAberto = await this.verificarCaixaAberto(usuario_id);
    if (caixaAberto) {
      throw new BadRequestException('O usuário já possui um caixa aberto.');
    }

    const novoCaixa = this.caixaRepository.create({
      usuario_id,
      valor_abertura,
      status: 'ABERTO',
    });

    return this.caixaRepository.save(novoCaixa);
  }

  // 3. FECHA O TURNO E CALCULA QUEBRAS
  async fecharCaixa(caixa_id: number, valor_fechamento_informado: number) {
    const caixa = await this.caixaRepository.findOne({ where: { id: caixa_id, status: 'ABERTO' } });
    
    if (!caixa) {
      throw new NotFoundException('Caixa não encontrado ou já está fechado.');
    }

    // Busca todas as vendas atreladas APENAS a este turno
    const vendas = await this.vendaRepository.find({ where: { caixa_id: caixa.id } });
    
    // Soma tudo que foi vendido
    const totalVendas = vendas.reduce((acc, venda) => acc + Number(venda.total), 0);
    
    // Calcula o valor esperado (Fundo de Troco Inicial + Vendas do Dia)
    const valor_fechamento_calculado = Number(caixa.valor_abertura) + totalVendas;
    
    // Calcula se faltou dinheiro (Quebra) ou se sobrou
    const diferenca = valor_fechamento_informado - valor_fechamento_calculado;

    // Atualiza o banco com a hora da verdade
    caixa.valor_fechamento_informado = valor_fechamento_informado;
    caixa.valor_fechamento_calculado = valor_fechamento_calculado;
    caixa.diferenca = diferenca;
    caixa.status = 'FECHADO';
    caixa.fechado_em = new Date();

    return this.caixaRepository.save(caixa);
  }
}