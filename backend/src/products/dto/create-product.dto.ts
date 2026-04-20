export class CreateProductDto {
  nome!: string;
  preco_venda!: number;
  codigo_barras?: string; // Opcional
  custo?: number;         // Opcional
  ativo!: boolean;
}