export class CreateProductDto {
  nome!: string;
  codigo_barras!: string;
  preco_venda!: number;
  custo?: number; // A interrogação indica que é opcional
}