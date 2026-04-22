import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {}

  findAll() {
    return this.clienteRepository.find({ order: { nome: 'ASC' } });
  }

  async create(data: Partial<Cliente>) {
    const novo = this.clienteRepository.create(data);
    return this.clienteRepository.save(novo);
  }

  // Função vital: Atualiza o quanto o cliente deve
  async atualizarSaldo(clienteId: number, valor: number) {
    const cliente = await this.clienteRepository.findOne({ where: { id: clienteId } });
    if (!cliente) throw new BadRequestException('Cliente não encontrado');

    const novoSaldo = Number(cliente.saldo_devedor) + Number(valor);
    
    // Validação de limite (opcional, mas boa prática)
    if (valor > 0 && novoSaldo > Number(cliente.limite_credito)) {
      throw new BadRequestException('Limite de crédito excedido para este cliente.');
    }

    cliente.saldo_devedor = novoSaldo;
    return this.clienteRepository.save(cliente);
  }
}