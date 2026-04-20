import { useState, useEffect, useMemo } from 'react';

interface Produto {
  id: number;
  nome: string;
  preco_venda: string;
  ativo: boolean;
}

export default function Admin() {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [produtoIdEstoque, setProdutoIdEstoque] = useState('');
  const [quantidadeEntrada, setQuantidadeEntrada] = useState('');

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [editandoPrecoId, setEditandoPrecoId] = useState<number | null>(null);
  const [novoPreco, setNovoPreco] = useState<string>('');

  const [abaAtual, setAbaAtual] = useState<'ATIVOS' | 'INATIVOS'>('ATIVOS');
  
  // NOVO: Estado para a barra de pesquisa
  const [termoBusca, setTermoBusca] = useState('');

  const carregarProdutos = () => {
    fetch('http://localhost:3000/products')
      .then(res => res.json())
      .then((data) => setProdutos(data))
      .catch(err => console.error(err));
  };

  useEffect(() => { carregarProdutos(); }, []);

  // ATUALIZADO: Agora o useMemo filtra pela aba E pelo texto da busca!
  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => {
      // 1. Regra da Aba
      const isAtivo = p.ativo !== false;
      const matchAba = abaAtual === 'ATIVOS' ? isAtivo : !isAtivo;
      
      // 2. Regra da Pesquisa (transforma tudo em minúsculo para não ter erro de maiúscula/minúscula)
      const matchBusca = p.nome.toLowerCase().includes(termoBusca.toLowerCase());

      // O produto só aparece se passar nas duas regras
      return matchAba && matchBusca;
    });
  }, [produtos, abaAtual, termoBusca]);

  const cadastrarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:3000/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, preco_venda: Number(preco), ativo: true })
    });
    if (res.ok) {
      alert("Produto cadastrado!");
      setNome(''); setPreco('');
      carregarProdutos();
    }
  };

  const darEntradaEstoque = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:3000/stock/entrada', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        produto_id: Number(produtoIdEstoque), 
        quantidade: Number(quantidadeEntrada),
        motivo: 'COMPRA' 
      })
    });
    if (res.ok) {
      alert("Estoque atualizado!");
      setQuantidadeEntrada('');
    }
  };

  const alternarStatus = async (produto: Produto) => {
    const statusAtual = produto.ativo !== undefined ? produto.ativo : true; 
    const res = await fetch(`http://localhost:3000/products/${produto.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !statusAtual })
    });
    if (res.ok) carregarProdutos();
  };

  const iniciarEdicaoPreco = (produto: Produto) => {
    setEditandoPrecoId(produto.id);
    setNovoPreco(Number(produto.preco_venda).toFixed(2));
  };

  const salvarNovoPreco = async (id: number) => {
    const res = await fetch(`http://localhost:3000/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preco_venda: Number(novoPreco) })
    });
    if (res.ok) {
      setEditandoPrecoId(null);
      carregarProdutos();
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-green-500">
          <h2 className="text-xl font-bold mb-4 text-gray-800">🆕 Novo Produto</h2>
          <form onSubmit={cadastrarProduto} className="flex gap-4">
            <input type="text" placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} className="flex-1 border border-gray-300 p-2 rounded outline-none focus:ring-2 focus:ring-green-500" required />
            <input type="number" step="0.01" placeholder="Preço" value={preco} onChange={e => setPreco(e.target.value)} className="w-32 border border-gray-300 p-2 rounded outline-none focus:ring-2 focus:ring-green-500" required />
            <button type="submit" className="bg-green-600 text-white px-6 rounded font-bold cursor-pointer hover:bg-green-700 transition-colors">Salvar</button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-500">
          <h2 className="text-xl font-bold mb-4 text-gray-800">📦 Entrada de Estoque</h2>
          <form onSubmit={darEntradaEstoque} className="flex gap-4">
            <select value={produtoIdEstoque} onChange={e => setProdutoIdEstoque(e.target.value)} className="flex-1 border border-gray-300 p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="">Selecione o Produto...</option>
              {produtos.filter(p => p.ativo !== false).map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            <input type="number" min="1" placeholder="Qtd" value={quantidadeEntrada} onChange={e => setQuantidadeEntrada(e.target.value)} className="w-24 border border-gray-300 p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" required />
            <button type="submit" className="bg-blue-600 text-white px-6 rounded font-bold cursor-pointer hover:bg-blue-700 transition-colors">OK</button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* ATUALIZADO: Container do cabeçalho da tabela com Flexbox para separar as abas da barra de pesquisa */}
        <div className="border-b border-gray-200 flex justify-between items-center pr-6 bg-gray-50">
          
          {/* Lado Esquerdo: Abas */}
          <div className="flex">
            <button 
              onClick={() => setAbaAtual('ATIVOS')}
              className={`px-8 py-4 font-bold text-sm transition-colors cursor-pointer ${abaAtual === 'ATIVOS' ? 'border-b-2 border-blue-500 text-blue-600 bg-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              PRODUTOS ATIVOS ({produtos.filter(p => p.ativo !== false).length})
            </button>
            <button 
              onClick={() => setAbaAtual('INATIVOS')}
              className={`px-8 py-4 font-bold text-sm transition-colors cursor-pointer ${abaAtual === 'INATIVOS' ? 'border-b-2 border-red-500 text-red-600 bg-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              INATIVADOS ({produtos.filter(p => p.ativo === false).length})
            </button>
          </div>

          {/* NOVO - Lado Direito: Barra de Pesquisa */}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-72 text-sm text-gray-700 shadow-sm"
            />
          </div>

        </div>
        
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="p-4 border-b border-gray-200">ID</th>
              <th className="p-4 border-b border-gray-200">Produto</th>
              <th className="p-4 border-b border-gray-200">Preço (R$)</th>
              <th className="p-4 border-b border-gray-200 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.map(produto => {
              const isEditing = editandoPrecoId === produto.id;
              
              return (
                <tr key={produto.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-500 font-semibold">#{produto.id}</td>
                  <td className="p-4 font-bold text-gray-800">{produto.nome}</td>
                  
                  <td className="p-4">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">R$</span>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={novoPreco} 
                          onChange={e => setNovoPreco(e.target.value)}
                          className="border border-blue-400 rounded px-2 py-1 w-24 outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <span className="font-bold text-blue-600">
                        R$ {Number(produto.preco_venda).toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </td>
                  
                  <td className="p-4 text-right space-x-2">
                    {isEditing ? (
                      <button 
                        onClick={() => salvarNovoPreco(produto.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded font-semibold text-sm transition-colors cursor-pointer"
                      >
                        Salvar
                      </button>
                    ) : (
                      <button 
                        onClick={() => iniciarEdicaoPreco(produto)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded font-semibold text-sm transition-colors cursor-pointer"
                      >
                        Editar Preço
                      </button>
                    )}
                    
                    <button 
                      onClick={() => alternarStatus(produto)}
                      className={`px-3 py-1.5 rounded font-semibold text-sm transition-colors cursor-pointer ${produto.ativo !== false ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                    >
                      {produto.ativo !== false ? 'Inativar' : 'Reativar'}
                    </button>
                  </td>
                </tr>
              );
            })}
            
            {produtosFiltrados.length === 0 && (
              <tr>
                <td colSpan={4} className="p-10 text-center text-gray-400 font-medium">
                  {termoBusca ? (
                     <span>Nenhum produto encontrado com o nome <b>"{termoBusca}"</b>.</span>
                  ) : (
                     <span>Nenhum produto nesta categoria.</span>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}