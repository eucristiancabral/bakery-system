import { useState, useEffect } from 'react';

export default function Admin() {
  // Estados para Cadastro de Produto
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  
  // Estados para Entrada de Estoque
  const [produtos, setProdutos] = useState<any[]>([]);
  const [produtoIdEstoque, setProdutoIdEstoque] = useState('');
  const [quantidadeEntrada, setQuantidadeEntrada] = useState('');

  // Carrega produtos para o Select de estoque
  const carregarProdutos = () => {
    fetch('http://localhost:3000/products')
      .then(res => res.json())
      .then(data => setProdutos(data));
  };

  useEffect(() => { carregarProdutos(); }, []);

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

  return (
    <div className="p-8 bg-gray-100 min-h-screen grid grid-cols-2 gap-8">
      
      {/* Formulário Novo Produto */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">🆕 Cadastrar Novo Produto</h2>
        <form onSubmit={cadastrarProduto} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome do Produto</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full border p-2 rounded mt-1" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Preço de Venda (R$)</label>
            <input type="number" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} className="w-full border p-2 rounded mt-1" required />
          </div>
          <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 cursor-pointer">Salvar Produto</button>
        </form>
      </div>

      {/* Formulário Entrada de Estoque */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">📦 Entrada de Mercadoria</h2>
        <form onSubmit={darEntradaEstoque} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Selecionar Produto</label>
            <select value={produtoIdEstoque} onChange={e => setProdutoIdEstoque(e.target.value)} className="w-full border p-2 rounded mt-1" required>
              <option value="">Selecione...</option>
              {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantidade que Chegou</label>
            <input type="number" value={quantidadeEntrada} onChange={e => setQuantidadeEntrada(e.target.value)} className="w-full border p-2 rounded mt-1" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 cursor-pointer">Atualizar Estoque</button>
        </form>
      </div>

    </div>
  );
}