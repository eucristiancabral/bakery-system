import { FormaPagamento } from '../entities/venda.entity';

// DTO Auxiliar para os itens do carrinho
export class ItemVendaDto {
  produto_id!: number;
  quantidade!: number;
}

// DTO Principal que o Frontend vai enviar
export class CreateSaleDto {
  forma_pagamento!: FormaPagamento;
  itens!: ItemVendaDto[]; 
  caixa_id!: number;
  cliente_id?: number;
}