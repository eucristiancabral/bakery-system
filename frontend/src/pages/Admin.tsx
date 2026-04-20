import { useState, useEffect, useMemo } from 'react';

interface Produto {
  id: number;
  nome: string;
  codigo_barras?: string | null;
  preco_venda: string | number;
  custo?: string | number | null;
  ativo: boolean;
}

export default function Admin() {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [custo, setCusto] = useState('');
  
  const [produtoIdEstoque, setProdutoIdEstoque] = useState('');
  const [quantidadeEntrada, setQuantidadeEntrada] = useState('');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  
  // ESTADOS DE EDIÇÃO DE LINHA
  const [idSendoEditado, setIdSendoEditado] = useState<number | null>(null);
  const [dadosEdicao, setDadosEdicao] = useState<Partial<Produto>>({});

  const [abaAtual, setAbaAtual] = useState<'ATIVOS' | 'INATIVOS'>('ATIVOS');
  const [termoBusca, setTermoBusca] = useState('');

  const carregarProdutos = () => {
    fetch('http://localhost:3000/products')
      .then(res => res.json())
      .then((data) => setProdutos(data))
      .catch(err => console.error(err));
  };

  useEffect(() => { carregarProdutos(); }, []);

  const produtosFiltrados = useMemo(() => {
    const termo = termoBusca.toLowerCase();
    return produtos.filter(p => {
      const isAtivo = p.ativo !== false;
      const matchAba = abaAtual === 'ATIVOS' ? isAtivo : !isAtivo;
      const nomeSeguro = p.nome ? String(p.nome).toLowerCase() : '';
      const codigoSeguro = p.codigo_barras ? String(p.codigo_barras).toLowerCase() : '';
      return matchAba && (nomeSeguro.includes(termo) || codigoSeguro.includes(termo));
    });
  }, [produtos, abaAtual, termoBusca]);

  const cadastrarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nome,
      preco_venda: Number(preco),
      codigo_barras: codigoBarras || null,
      custo: custo ? Number(custo) : null,
      ativo: true
    };
    const res = await fetch('http://localhost:3000/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert("Produto cadastrado!");
      setNome(''); setPreco(''); setCodigoBarras(''); setCusto('');
      carregarProdutos();
    }
  };

  // INICIAR EDIÇÃO: Carrega todos os dados do produto para o estado temporário
  const iniciarEdicao = (produto: Produto) => {
    setIdSendoEditado(produto.id);
    setDadosEdicao({
      nome: produto.nome,
      codigo_barras: produto.codigo_barras,
      preco_venda: produto.preco_venda,
      custo: produto.custo
    });
  };

  // SALVAR EDIÇÃO: Envia todos os campos alterados
  const salvarEdicao = async (id: number) => {
    const res = await fetch(`http://localhost:3000/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...dadosEdicao,
        preco_venda: Number(dadosEdicao.preco_venda),
        custo: dadosEdicao.custo ? Number(dadosEdicao.custo) : null
      })
    });
    if (res.ok) {
      setIdSendoEditado(null);
      carregarProdutos();
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

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      
      {/* Seção de Cadastro e Entrada de Estoque */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-green-500">
          <h2 className="text-xl font-bold mb-4 text-gray-800">🆕 Novo Produto</h2>
          <form onSubmit={cadastrarProduto} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Nome *" value={nome} onChange={e => setNome(e.target.value)} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-green-500" required />
              <input type="text" placeholder="Cód. Barras" value={codigoBarras} onChange={e => setCodigoBarras(e.target.value)} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input type="number" step="0.01" placeholder="Preço Venda *" value={preco} onChange={e => setPreco(e.target.value)} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-green-500" required />
              <input type="number" step="0.01" placeholder="Custo Unitário" value={custo} onChange={e => setCusto(e.target.value)} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 cursor-pointer transition-all">Cadastrar</button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-500">
          <h2 className="text-xl font-bold mb-4 text-gray-800">📦 Entrada de Estoque</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            fetch('http://localhost:3000/stock/entrada', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ produto_id: Number(produtoIdEstoque), quantidade: Number(quantidadeEntrada), motivo: 'COMPRA' })
            }).then(() => { alert("Estoque atualizado!"); setQuantidadeEntrada(''); });
          }} className="space-y-4">
            <select value={produtoIdEstoque} onChange={e => setProdutoIdEstoque(e.target.value)} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="">Selecione o Produto...</option>
              {produtos.filter(p => p.ativo !== false).map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            <input type="number" min="1" placeholder="Quantidade" value={quantidadeEntrada} onChange={e => setQuantidadeEntrada(e.target.value)} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" required />
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 cursor-pointer transition-all">Registrar Entrada</button>
          </form>
        </div>
      </div>

      {/* TABELA DE GESTÃO COMPLETA */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="border-b border-gray-200 flex justify-between items-center pr-6 bg-gray-50">
          <div className="flex">
            <button onClick={() => setAbaAtual('ATIVOS')} className={`px-8 py-4 font-bold text-sm cursor-pointer ${abaAtual === 'ATIVOS' ? 'border-b-2 border-blue-500 text-blue-600 bg-white' : 'text-gray-500'}`}>ATIVOS</button>
            <button onClick={() => setAbaAtual('INATIVOS')} className={`px-8 py-4 font-bold text-sm cursor-pointer ${abaAtual === 'INATIVOS' ? 'border-b-2 border-red-500 text-red-600 bg-white' : 'text-gray-500'}`}>INATIVOS</button>
          </div>
          <input type="text" placeholder="Buscar..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} className="px-4 py-2 border rounded-lg w-64 text-sm" />
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-bold">
            <tr>
              <th className="p-4">Cód. Barras</th>
              <th className="p-4">Nome do Produto</th>
              <th className="p-4 text-center">Custo (R$)</th>
              <th className="p-4 text-center">Venda (R$)</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.map(produto => {
              const isEditing = idSendoEditado === produto.id;
              
              return (
                <tr key={produto.id} className="border-b border-gray-100 hover:bg-gray-50 transition-all">
                  {/* COLUNA: CÓDIGO DE BARRAS */}
                  <td className="p-4">
                    {isEditing ? (
                      <input type="text" value={dadosEdicao.codigo_barras || ''} onChange={e => setDadosEdicao({...dadosEdicao, codigo_barras: e.target.value})} className="border rounded px-2 py-1 w-full text-xs font-mono" />
                    ) : (
                      <span className="text-xs font-mono text-gray-400">{produto.codigo_barras || '---'}</span>
                    )}
                  </td>

                  {/* COLUNA: NOME */}
                  <td className="p-4">
                    {isEditing ? (
                      <input type="text" value={dadosEdicao.nome || ''} onChange={e => setDadosEdicao({...dadosEdicao, nome: e.target.value})} className="border rounded px-2 py-1 w-full font-bold" />
                    ) : (
                      <span className="font-bold text-gray-700">{produto.nome}</span>
                    )}
                  </td>

                  {/* COLUNA: CUSTO */}
                  <td className="p-4 text-center">
                    {isEditing ? (
                      <input type="number" step="0.01" value={dadosEdicao.custo || ''} onChange={e => setDadosEdicao({...dadosEdicao, custo: e.target.value})} className="border rounded px-2 py-1 w-20 text-center" />
                    ) : (
                      <span className="text-gray-500">{produto.custo ? `R$ ${Number(produto.custo).toFixed(2).replace('.', ',')}` : '---'}</span>
                    )}
                  </td>

                  {/* COLUNA: VENDA */}
                  <td className="p-4 text-center">
                    {isEditing ? (
                      <input type="number" step="0.01" value={dadosEdicao.preco_venda || ''} onChange={e => setDadosEdicao({...dadosEdicao, preco_venda: e.target.value})} className="border border-blue-400 rounded px-2 py-1 w-20 text-center font-bold text-blue-600" />
                    ) : (
                      <span className="font-bold text-blue-600">R$ {Number(produto.preco_venda).toFixed(2).replace('.', ',')}</span>
                    )}
                  </td>

                  {/* COLUNA: AÇÕES */}
                  <td className="p-4 text-right space-x-2">
                    {isEditing ? (
                      <>
                        <button onClick={() => salvarEdicao(produto.id)} className="bg-green-500 text-white px-3 py-1 rounded text-xs font-bold cursor-pointer">Salvar</button>
                        <button onClick={() => setIdSendoEditado(null)} className="bg-gray-400 text-white px-3 py-1 rounded text-xs font-bold cursor-pointer">Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => iniciarEdicao(produto)} className="text-blue-500 hover:underline text-xs font-bold cursor-pointer">Editar</button>
                        <button onClick={() => alternarStatus(produto)} className={`px-3 py-1 rounded text-[10px] font-bold cursor-pointer ${produto.ativo !== false ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                          {produto.ativo !== false ? 'INATIVAR' : 'REATIVAR'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}