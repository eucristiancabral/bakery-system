import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  list() {
    return this.customersService.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.customersService.create(body);
  }

  // Rota para quando o cliente vier pagar a conta na padaria
  @Post(':id/pagar')
  pagar(@Param('id') id: string, @Body() body: { valor: number }) {
    // Passamos o valor negativo para subtrair da dívida
    return this.customersService.atualizarSaldo(+id, -body.valor);
  }
}