import { useEffect, useState, useMemo } from 'react';

interface Venda {
  id: number;
  total: string;
  forma_pagamento: string;
  status: string;
  criado_em: string;
}

// Criamos um "tipo" para garantir que não haja erros de digitação nos filtros
type FiltroTempo = 'HOJE' | 'SEMANA' | 'MES' | 'ANO' | 'TUDO';

export default function Relatorios() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [filtro, setFiltro] = useState<FiltroTempo>('HOJE'); // Começa mostrando as vendas de hoje

  useEffect(() => {
    fetch('http://localhost:3000/sales')
      .then(res => res.json())
      .then((data: Venda[]) => setVendas(data))
      .catch(error => console.error("Erro ao buscar vendas:", error));
  }, []);

  // O useMemo é a inteligência aqui. Ele só refaz esse cálculo se a 'lista de vendas' ou o 'filtro' mudarem.
  const vendasFiltradas = useMemo(() => {
    const hoje = new Date();
    
    return vendas.filter(venda => {
      const dataVenda = new Date(venda.criado_em);

      switch (filtro) {
        case 'HOJE':
          return dataVenda.toDateString() === hoje.toDateString();
        case 'SEMANA':
          // Calcula a diferença em dias
          const diffTempo = hoje.getTime() - dataVenda.getTime();
          const diffDias = Math.floor(diffTempo / (1000 * 60 * 60 * 24));
          return diffDias <= 7;
        case 'MES':
          return dataVenda.getMonth() === hoje.getMonth() && dataVenda.getFullYear() === hoje.getFullYear();
        case 'ANO':
          return dataVenda.getFullYear() === hoje.getFullYear();
        default:
          return true; // Retorna todas as vendas
      }
    });
  }, [vendas, filtro]);

  // Agora as métricas são calculadas apenas em cima das vendas que passaram no filtro!
  const faturamentoTotal = vendasFiltradas.reduce((acc, venda) => acc + Number(venda.total), 0);
  const quantidadeVendas = vendasFiltradas.length;
  const ticketMedio = quantidadeVendas > 0 ? faturamentoTotal / quantidadeVendas : 0;
  const maiorVenda = vendasFiltradas.reduce((max, venda) => Number(venda.total) > max ? Number(venda.total) : max, 0);

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      
      {/* Cabeçalho com o Filtro */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">📊 Dashboard de Vendas</h2>
        
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-600">Período:</span>
          <select 
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as FiltroTempo)}
            className="border border-gray-300 p-2 rounded-lg font-medium text-gray-700 bg-white shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="HOJE">Hoje</option>
            <option value="SEMANA">Últimos 7 Dias</option>
            <option value="MES">Este Mês</option>
            <option value="ANO">Este Ano</option>
            <option value="TUDO">Todo o Histórico</option>
          </select>
        </div>
      </div>

      {/* Grid de Cards Inteligentes */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
          <p className="text-sm text-gray-500 font-semibold mb-1">Vendas no Período</p>
          <p className="text-3xl font-bold text-gray-800">{quantidadeVendas}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
          <p className="text-sm text-gray-500 font-semibold mb-1">Faturamento</p>
          <p className="text-3xl font-bold text-green-600">
            R$ {faturamentoTotal.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500 font-semibold mb-1">Ticket Médio</p>
          <p className="text-3xl font-bold text-yellow-600">
            R$ {ticketMedio.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
          <p className="text-sm text-gray-500 font-semibold mb-1">Maior Venda</p>
          <p className="text-3xl font-bold text-purple-600">
            R$ {maiorVenda.toFixed(2).replace('.', ',')}
          </p>
        </div>

      </div>

      {/* Tabela Reativa ao Filtro */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Transações do Período</h3>
          <span className="text-sm text-gray-500 font-medium">Exibindo {quantidadeVendas} registros</span>
        </div>
        
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 sticky top-0 shadow-sm">
              <tr>
                <th className="p-4 border-b">ID Venda</th>
                <th className="p-4 border-b">Data e Hora</th>
                <th className="p-4 border-b">Pagamento</th>
                <th className="p-4 border-b">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              {vendasFiltradas.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500">Nenhuma venda neste período.</td></tr>
              ) : (
                vendasFiltradas.map(venda => (
                  <tr key={venda.id} className="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                    <td className="p-4 font-semibold text-gray-700">#{venda.id}</td>
                    <td className="p-4 text-gray-600">
                      {new Date(venda.criado_em).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-4">
                      <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">
                        {venda.forma_pagamento}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-blue-600">
                      R$ {Number(venda.total).toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}