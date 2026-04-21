import { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '../utils/api';

// ATUALIZADO: Agora o TypeScript sabe que uma Venda possui Itens e Produtos com Custo
interface Venda {
  id: number;
  total: string;
  forma_pagamento: string;
  status: string;
  criado_em: string;
  itens?: Array<{
    quantidade: number;
    preco_unitario: string;
    produto?: {
      nome: string;
      custo?: string | null;
    }
  }>;
}

type FiltroTempo = 'HOJE' | 'SEMANA' | 'MES' | 'ANO' | 'TUDO';

export default function Relatorios() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [filtro, setFiltro] = useState<FiltroTempo>('HOJE');

  useEffect(() => {
    apiFetch('/products')
      .then(res => res.json())
      .then((data: Venda[]) => setVendas(data))
      .catch(error => console.error("Erro ao buscar vendas:", error));
  }, []);

  const vendasFiltradas = useMemo(() => {
    const hoje = new Date();
    return vendas.filter(venda => {
      const dataVenda = new Date(venda.criado_em);
      switch (filtro) {
        case 'HOJE': return dataVenda.toDateString() === hoje.toDateString();
        case 'SEMANA': return Math.floor((hoje.getTime() - dataVenda.getTime()) / (1000 * 60 * 60 * 24)) <= 7;
        case 'MES': return dataVenda.getMonth() === hoje.getMonth() && dataVenda.getFullYear() === hoje.getFullYear();
        case 'ANO': return dataVenda.getFullYear() === hoje.getFullYear();
        default: return true;
      }
    });
  }, [vendas, filtro]);

  // MATEMÁTICA FINANCEIRA AVANÇADA
  const { faturamentoTotal, custoTotal, quantidadeVendas } = useMemo(() => {
    let fat = 0;
    let custo = 0;

    vendasFiltradas.forEach(venda => {
      fat += Number(venda.total);
      
      // Calcula o custo dessa venda específica verificando item por item
      if (venda.itens) {
        venda.itens.forEach(item => {
          const custoProduto = item.produto?.custo ? Number(item.produto.custo) : 0;
          custo += (custoProduto * item.quantidade);
        });
      }
    });

    return { faturamentoTotal: fat, custoTotal: custo, quantidadeVendas: vendasFiltradas.length };
  }, [vendasFiltradas]);

  const lucroLiquido = faturamentoTotal - custoTotal;
  const margemLucro = faturamentoTotal > 0 ? (lucroLiquido / faturamentoTotal) * 100 : 0;
  const ticketMedio = quantidadeVendas > 0 ? faturamentoTotal / quantidadeVendas : 0;

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      
      {/* Cabeçalho e Filtro */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">📊 Inteligência de Negócio (BI)</h2>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-600">Período:</span>
          <select 
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as FiltroTempo)}
            className="border border-gray-300 p-2 rounded-lg font-medium text-gray-700 bg-white shadow-sm cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="HOJE">Hoje</option>
            <option value="SEMANA">Últimos 7 Dias</option>
            <option value="MES">Este Mês</option>
            <option value="ANO">Este Ano</option>
            <option value="TUDO">Todo o Histórico</option>
          </select>
        </div>
      </div>

      {/* LINHA 1: RESULTADOS FINANCEIROS (CUSTO X GANHO) */}
      <h3 className="text-lg font-bold text-gray-600 mb-4 uppercase tracking-wider">Resultados Financeiros</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
          <p className="text-sm text-gray-500 font-bold mb-1">Faturamento Bruto</p>
          <p className="text-3xl font-bold text-blue-600">R$ {faturamentoTotal.toFixed(2).replace('.', ',')}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-400 relative overflow-hidden">
          <p className="text-sm text-gray-500 font-bold mb-1 relative z-10">Custo Total Produtos</p>
          <p className="text-3xl font-bold text-red-500 relative z-10">- R$ {custoTotal.toFixed(2).replace('.', ',')}</p>
          <div className="absolute right-0 bottom-0 opacity-10 text-6xl">📉</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500 relative overflow-hidden">
          <p className="text-sm text-gray-500 font-bold mb-1 relative z-10">Lucro Líquido</p>
          <p className="text-3xl font-bold text-green-600 relative z-10">R$ {lucroLiquido.toFixed(2).replace('.', ',')}</p>
          <div className="absolute right-0 bottom-0 opacity-10 text-6xl">💰</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
          <p className="text-sm text-gray-500 font-bold mb-1">Margem de Lucro (%)</p>
          <p className="text-3xl font-bold text-purple-600">{margemLucro.toFixed(1)}%</p>
          <div className="w-full bg-gray-200 h-2 mt-3 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full" style={{ width: `${Math.min(margemLucro, 100)}%` }}></div>
          </div>
        </div>

      </div>

      {/* LINHA 2: MÉTRICAS DE VENDAS E TABELA */}
      <h3 className="text-lg font-bold text-gray-600 mb-4 uppercase tracking-wider">Desempenho de Vendas</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Métricas Menores */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 font-bold mb-1">Vendas Realizadas</p>
              <p className="text-2xl font-bold text-gray-800">{quantidadeVendas} cupons</p>
            </div>
            <div className="bg-blue-100 text-blue-600 p-3 rounded-full text-xl">🛒</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500 font-bold mb-1">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-800">R$ {ticketMedio.toFixed(2).replace('.', ',')} / cliente</p>
            </div>
            <div className="bg-yellow-100 text-yellow-600 p-3 rounded-full text-xl">🏷️</div>
          </div>
        </div>

        {/* Tabela de Transações */}
        <div className="col-span-1 lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">Transações do Período</h3>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 sticky top-0 shadow-sm uppercase font-bold text-xs">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Pagamento</th>
                  <th className="p-3 text-right">Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {vendasFiltradas.length === 0 ? (
                  <tr><td colSpan={3} className="p-6 text-center text-gray-500">Nenhuma venda encontrada.</td></tr>
                ) : (
                  vendasFiltradas.map(venda => (
                    <tr key={venda.id} className="hover:bg-gray-50 border-b border-gray-50">
                      <td className="p-3 text-gray-600">{new Date(venda.criado_em).toLocaleString('pt-BR')}</td>
                      <td className="p-3"><span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-[10px] font-bold">{venda.forma_pagamento}</span></td>
                      <td className="p-3 font-bold text-blue-600 text-right">R$ {Number(venda.total).toFixed(2).replace('.', ',')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}