import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

interface Produto {
  id: number;
  nome: string;
  preco_venda: string;
  ativo: boolean;
  stock?: { quantidade: string | number } | Array<{ quantidade: string | number }>;
}

interface ItemCarrinho {
  produto_id: number;
  nome: string;
  preco_unitario: number;
  quantidade: number;
  subtotal: number;
}

interface DadosCupom {
  itens: ItemCarrinho[];
  total: number;
  pagamento: string;
  data: string;
}

export default function PDV() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<string>('PIX');
  const [cupomImpressao, setCupomImpressao] = useState<DadosCupom | null>(null);

  // === NOVOS ESTADOS DO CAIXA ===
  const [caixaAtual, setCaixaAtual] = useState<{ id: number; valor_abertura: string } | null>(null);
  const [carregandoCaixa, setCarregandoCaixa] = useState(true);
  const [valorAbertura, setValorAbertura] = useState('');
  const [valorFechamento, setValorFechamento] = useState('');
  const [modalFechamento, setModalFechamento] = useState(false);

  // Função para extrair o ID do usuário de dentro do Token JWT
  const getUsuarioId = () => {
    const token = localStorage.getItem('token');
    if (!token) return 0;
    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // Decodifica o payload do JWT
      return payload.sub; // 'sub' é o ID do usuário que configuramos no backend
    } catch (e) {
      return 0;
    }
  };

  const usuarioId = getUsuarioId();

  // === LÓGICA DE TURNO (CAIXA) ===
  const verificarCaixa = async () => {
    if (!usuarioId) return;
    try {
      const res = await apiFetch(`/caixas/status/${usuarioId}`);
      if (res.ok) {
        const dados = await res.json();
        // Se a API retornar texto vazio, dados é nulo (Caixa fechado)
        setCaixaAtual(dados ? dados : null);
      }
    } catch (err) {
      console.error("Erro ao verificar caixa", err);
    } finally {
      setCarregandoCaixa(false);
    }
  };

  const abrirCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valorAbertura || Number(valorAbertura) < 0) return alert('Digite um valor válido para o troco.');
    
    const res = await apiFetch('/caixas/abrir', {
      method: 'POST',
      body: JSON.stringify({ usuario_id: usuarioId, valor_abertura: Number(valorAbertura) })
    });

    if (res.ok) {
      alert('✅ Caixa aberto com sucesso! Boas vendas!');
      verificarCaixa(); // Recarrega o status
    } else {
      alert('Erro ao abrir o caixa.');
    }
  };

  const fecharCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caixaAtual) return;

    const confirmacao = window.confirm("Tem certeza que deseja encerrar o turno?");
    if (!confirmacao) return;

    const res = await apiFetch('/caixas/fechar', {
      method: 'POST',
      body: JSON.stringify({ caixa_id: caixaAtual.id, valor_fechamento_informado: Number(valorFechamento) })
    });

    if (res.ok) {
      const resultado = await res.json();
      const dif = Number(resultado.diferenca);
      let msg = '✅ Caixa fechado com sucesso!\n';
      
      if (dif < 0) msg += `⚠️ ATENÇÃO: Faltou R$ ${Math.abs(dif).toFixed(2)} na gaveta. (Quebra de caixa)`;
      else if (dif > 0) msg += `⚠️ ATENÇÃO: Sobrou R$ ${dif.toFixed(2)} na gaveta.`;
      else msg += `🎯 Perfeito! O dinheiro bateu exatamente.`;

      alert(msg);
      setModalFechamento(false);
      setCaixaAtual(null); // Bloqueia a tela novamente
    } else {
      alert('Erro ao fechar o caixa.');
    }
  };

  // === LÓGICA DE PRODUTOS E VENDAS ===
  const obterEstoque = (produto: Produto): number => {
    if (!produto.stock) return 0;
    if (Array.isArray(produto.stock)) return produto.stock.length > 0 ? Number(produto.stock[0].quantidade) : 0;
    return Number(produto.stock.quantidade);
  };

  const carregarProdutos = () => {
    apiFetch('/products')
      .then((res) => res.json())
      .then((data: Produto[]) => setProdutos(data.filter(p => p.ativo !== false)))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    verificarCaixa();
    carregarProdutos();
  }, []);

  const adicionarAoCarrinho = (produto: Produto) => { /* ... (Mesmo código anterior) ... */ 
    const preco = Number(produto.preco_venda);
    const estoqueDisponivel = obterEstoque(produto);

    setCarrinho((atual) => {
      const itemExistente = atual.find(item => item.produto_id === produto.id);
      if (itemExistente) {
        if (itemExistente.quantidade >= estoqueDisponivel) {
          alert(`Estoque insuficiente! Só restam ${estoqueDisponivel} unidades.`);
          return atual;
        }
        return atual.map(item => item.produto_id === produto.id ? { ...item, quantidade: item.quantidade + 1, subtotal: (item.quantidade + 1) * item.preco_unitario } : item);
      } else {
        return [...atual, { produto_id: produto.id, nome: produto.nome, preco_unitario: preco, quantidade: 1, subtotal: preco }];
      }
    });
  };

  const removerDoCarrinho = (id: number) => setCarrinho(atual => atual.filter(item => item.produto_id !== id));

  const atualizarQuantidade = (produtoId: number, novaQuantidade: number) => {
    if (novaQuantidade < 1) return; 
    const produtoBase = produtos.find(p => p.id === produtoId);
    const estoqueDisponivel = produtoBase ? obterEstoque(produtoBase) : 0;
    if (novaQuantidade > estoqueDisponivel) return alert(`Quantidade inválida! Só restam ${estoqueDisponivel} unidades.`);
    setCarrinho(atual => atual.map(item => item.produto_id === produtoId ? { ...item, quantidade: novaQuantidade, subtotal: novaQuantidade * item.preco_unitario } : item));
  };

  const totalVenda = carrinho.reduce((acc, item) => acc + item.subtotal, 0);

  const finalizarVenda = async () => {
    if (!caixaAtual) return alert("Abra o caixa primeiro!");

    const payload = {
      forma_pagamento: formaPagamento,
      caixa_id: caixaAtual.id, // ENVIA O ID DO CAIXA AQUI!
      itens: carrinho.map(item => ({ produto_id: item.produto_id, quantidade: item.quantidade }))
    };

    try {
      const response = await apiFetch('/sales', { method: 'POST', body: JSON.stringify(payload) });

      if (response.ok) {
        setCupomImpressao({ itens: [...carrinho], total: totalVenda, pagamento: formaPagamento, data: new Date().toLocaleString('pt-BR') });
        alert('✅ Venda finalizada!');
        setCarrinho([]); setFormaPagamento('PIX'); carregarProdutos();

        setTimeout(() => {
          window.print();
          setTimeout(() => setCupomImpressao(null), 1000); 
        }, 500);
      } else {
        const errorData = await response.json();
        alert(`❌ Erro ao vender: ${errorData.message}`);
      }
    } catch (error) { alert('❌ Erro de conexão com o servidor.'); }
  };

  if (carregandoCaixa) return <div className="p-10 text-center font-bold text-gray-500">Verificando status do caixa...</div>;

  // === TELA DE BLOQUEIO (CAIXA FECHADO) ===
  if (!caixaAtual) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-gray-100 font-sans print:hidden">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-96 text-center border-t-8 border-red-500">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Caixa Fechado</h2>
          <p className="text-gray-500 mb-6 text-sm">Você precisa abrir um turno informando o fundo de troco para começar a vender.</p>
          
          <form onSubmit={abrirCaixa} className="space-y-4">
            <div>
              <label className="block text-left text-sm font-bold text-gray-700 mb-1">Fundo de Troco (Gaveta):</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500 font-bold">R$</span>
                <input type="number" step="0.01" min="0" required value={valorAbertura} onChange={e => setValorAbertura(e.target.value)} className="w-full pl-10 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg" placeholder="0.00" />
              </div>
            </div>
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md">
              Abrir Caixa
            </button>
          </form>
        </div>
      </div>
    );
  }

  // === TELA NORMAL DO PDV ===
  return (
    <>
      <div className="flex h-[calc(100vh-64px)] bg-gray-100 font-sans overflow-hidden print:hidden relative">
        
        {/* Botão de Fechar Caixa no canto superior esquerdo da vitrine */}
        <button 
          onClick={() => setModalFechamento(true)}
          className="absolute top-4 left-6 z-10 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors flex items-center gap-2 cursor-pointer border border-red-200"
        >
          🔒 Encerrar Turno
        </button>

        {/* Vitrine */}
        <div className="w-2/3 p-6 pt-16 overflow-y-auto">
          {/* ... (Todo o código do mapeamento dos produtos continua igualzinho) ... */}
          <div className="grid grid-cols-3 gap-4">
            {produtos.map((produto) => {
              const estoque = obterEstoque(produto);
              const semEstoque = estoque <= 0;
              return (
                <button key={produto.id} onClick={() => adicionarAoCarrinho(produto)} disabled={semEstoque} className={`relative p-6 rounded-xl shadow text-left transition-all border ${semEstoque ? 'bg-gray-200 cursor-not-allowed opacity-60' : 'bg-white hover:bg-blue-50 active:scale-95 border-transparent'}`}>
                  <h3 className="font-semibold text-gray-700 text-lg pr-12">{produto.nome}</h3>
                  <p className="text-blue-600 font-bold mt-2 text-xl">R$ {Number(produto.preco_venda).toFixed(2).replace('.', ',')}</p>
                  <span className={`absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full ${semEstoque ? 'bg-red-200 text-red-800' : 'bg-green-100 text-green-800'}`}>{estoque} un.</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cupom do Caixa (Lateral Direita) */}
        <div className="w-1/3 bg-white border-l border-gray-200 shadow-2xl flex flex-col">
          {/* ... (Seção de carrinho igual) ... */}
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Cupom Atual</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {carrinho.length === 0 ? <p className="text-gray-400 text-center mt-10">O carrinho está vazio.</p> : carrinho.map((item) => (
              <div key={item.produto_id} className="flex justify-between items-start border-b border-gray-100 pb-4">
                <div className="flex-1">
                  <p className="font-semibold text-gray-700">{item.nome}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => atualizarQuantidade(item.produto_id, item.quantidade - 1)} disabled={item.quantidade <= 1} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded">-</button>
                    <input type="number" min="1" value={item.quantidade} onChange={(e) => atualizarQuantidade(item.produto_id, Number(e.target.value))} className="w-16 text-center border rounded p-1 outline-none" />
                    <button onClick={() => atualizarQuantidade(item.produto_id, item.quantidade + 1)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded">+</button>
                    <p className="text-sm text-gray-500 ml-2">x R$ {item.preco_unitario.toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between h-full ml-4">
                  <button onClick={() => removerDoCarrinho(item.produto_id)} className="text-red-500 hover:text-red-700 font-bold">X</button>
                  <p className="font-bold text-gray-800 mt-3">R$ {item.subtotal.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-600 mb-2">Forma de Pagamento</label>
              <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className="w-full p-3 border rounded-lg bg-white outline-none">
                <option value="PIX">PIX</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="CARTAO_DEBITO">Cartão de Débito</option>
              </select>
            </div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-xl font-bold text-gray-600">Total:</span>
              <span className="text-3xl font-extrabold text-blue-600">R$ {totalVenda.toFixed(2).replace('.', ',')}</span>
            </div>
            <button onClick={finalizarVenda} disabled={carrinho.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl text-xl transition-colors cursor-pointer">
              Finalizar Venda
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE FECHAMENTO DE CAIXA */}
      {modalFechamento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-[400px]">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 border-b pb-2">Encerrar Turno</h2>
            <p className="text-gray-600 text-sm mb-6">Abra a gaveta, conte todas as notas e moedas e digite o valor total abaixo.</p>
            
            <form onSubmit={fecharCaixa} className="space-y-4">
              <div>
                <label className="block text-left text-sm font-bold text-gray-700 mb-1">Total contado na gaveta:</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500 font-bold">R$</span>
                  <input type="number" step="0.01" min="0" required value={valorFechamento} onChange={e => setValorFechamento(e.target.value)} className="w-full pl-10 p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xl text-blue-600" placeholder="0.00" />
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setModalFechamento(false)} className="w-1/2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md cursor-pointer">
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ... (Código de Impressão do Cupom lá no final continua igual) ... */}
      {cupomImpressao && (
        <div className="hidden print:block font-mono text-[12px] text-black w-[80mm] mx-auto bg-white p-2">
          {/* Cabeçalho da Padaria */}
          <div className="text-center mb-4">
            <h1 className="font-bold text-[16px]">MINHA PADARIA SaaS</h1>
            <p className="text-[10px]">CUPOM NÃO FISCAL</p>
            <p className="text-[10px]">Data: {cupomImpressao.data}</p>
          </div>
          <p className="text-[10px] mb-1">--------------------------------</p>
          <div className="flex justify-between font-bold text-[10px] mb-1">
            <span className="w-3/5">DESCRIÇÃO</span>
            <span className="w-1/5 text-center">QTD</span>
            <span className="w-1/5 text-right">TOTAL</span>
          </div>
          <p className="text-[10px] mb-2">--------------------------------</p>
          <div className="mb-4">
            {cupomImpressao.itens.map((item, index) => (
              <div key={index} className="flex justify-between text-[11px] mb-1">
                <span className="w-3/5 truncate pr-1">{item.nome}</span>
                <span className="w-1/5 text-center">{item.quantidade}</span>
                <span className="w-1/5 text-right">{item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] mb-2">--------------------------------</p>
          <div className="flex justify-between font-bold text-[14px] mb-1">
            <span>TOTAL:</span>
            <span>R$ {cupomImpressao.total.toFixed(2).replace('.', ',')}</span>
          </div>
          <div className="flex justify-between text-[11px] mb-4">
            <span>PAGAMENTO:</span>
            <span>{cupomImpressao.pagamento.replace('_', ' ')}</span>
          </div>
          <div className="text-center mt-6">
            <p className="text-[10px]">OBRIGADO PELA PREFERÊNCIA!</p>
            <p className="text-[10px]">.</p>
          </div>
        </div>
      )}
    </>
  );
}