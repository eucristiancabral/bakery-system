import { useState, useEffect } from 'react';

interface Produto {
  id: number;
  nome: string;
  preco_venda: string;
  ativo: boolean; // Controla se aparece no PDV
}

export default function Admin() {
  // Estados dos Formulários
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [produtoIdEstoque, setProdutoIdEstoque] = useState('');
  const [quantidadeEntrada, setQuantidadeEntrada] = useState('');

  // Estados da Tabela de Gestão
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [editandoPrecoId, setEditandoPrecoId] = useState<number | null>(null);
  const [novoPreco, setNovoPreco] = useState<string>('');

  const carregarProdutos = () => {
    fetch('http://localhost:3000/products')
      .then(res => res.json())
      .then((data) => setProdutos(data))
      .catch(err => console.error(err));
  };

  useEffect(() => { carregarProdutos(); }, []);

  // --- FUNÇÕES DE CRIAÇÃO ---
  const cadastrarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('http://localhost:3000/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, preco_venda: Number(preco), ativo: true })
    });
    if (res.ok) {
      alert("Produto cadastrado com sucesso!");
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

  // --- NOVO: FUNÇÕES DE ATUALIZAÇÃO (CRUD) ---
  const alternarStatus = async (produto: Produto) => {
    // Se não tiver o campo ativo no banco, assumimos true e invertemos
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
    } else {
      alert("Erro ao atualizar o preço.");
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      
      {/* Container Superior: Formulários */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        
        {/* Formulário Novo Produto */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">🆕 Cadastrar Novo Produto</h2>
          <form onSubmit={cadastrarProduto} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome do Produto</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full border border-gray-300 p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Preço de Venda (R$)</label>
              <input type="number" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} className="w-full border border-gray-300 p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 cursor-pointer transition-colors">Salvar Produto</button>
          </form>
        </div>

        {/* Formulário Entrada de Estoque */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">📦 Entrada de Mercadoria</h2>
          <form onSubmit={darEntradaEstoque} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Selecionar Produto</label>
              <select value={produtoIdEstoque} onChange={e => setProdutoIdEstoque(e.target.value)} className="w-full border border-gray-300 p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none" required>
                <option value="">Selecione...</option>
                {/* Só permite dar entrada em estoque de produtos ATIVOS */}
                {produtos.filter(p => p.ativo !== false).map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantidade Recebida</label>
              <input type="number" min="1" value={quantidadeEntrada} onChange={e => setQuantidadeEntrada(e.target.value)} className="w-full border border-gray-300 p-2 rounded mt-1 focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 cursor-pointer transition-colors">Atualizar Estoque</button>
          </form>
        </div>

      </div>

      {/* Container Inferior: Tabela de Gestão (O CRUD) */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">📋 Gestão de Produtos</h2>
          <span className="text-sm font-medium text-gray-500">Total: {produtos.length} produtos</span>
        </div>
        
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 sticky top-0 shadow-sm z-10">
              <tr>
                <th className="p-4 border-b">ID</th>
                <th className="p-4 border-b">Nome do Produto</th>
                <th className="p-4 border-b">Preço (R$)</th>
                <th className="p-4 border-b text-center">Status</th>
                <th className="p-4 border-b text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map(produto => {
                const isActive = produto.ativo !== false; // Fallback caso a coluna não exista inicialmente
                const isEditing = editandoPrecoId === produto.id;

                return (
                  <tr key={produto.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${!isActive ? 'bg-gray-50 opacity-75' : ''}`}>
                    <td className="p-4 font-semibold text-gray-700">#{produto.id}</td>
                    <td className="p-4 text-gray-800 font-medium">{produto.nome}</td>
                    
                    {/* Coluna Dinâmica: Preço ou Input de Edição */}
                    <td className="p-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">R$</span>
                          <input 
                            type="number" 
                            step="0.01"
                            value={novoPreco}
                            onChange={(e) => setNovoPreco(e.target.value)}
                            className="w-24 border border-blue-400 rounded px-2 py-1 text-blue-700 outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-blue-600">
                          R$ {Number(produto.preco_venda).toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </td>

                    {/* Coluna Status */}
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {isActive ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </td>

                    {/* Coluna de Ações */}
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
                        className={`px-3 py-1.5 rounded font-semibold text-sm transition-colors cursor-pointer ${isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      >
                        {isActive ? 'Inativar' : 'Reativar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}