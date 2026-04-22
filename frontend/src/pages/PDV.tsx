import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '../utils/api';

interface Produto {
  id: number;
  nome: string;
  preco_venda: string;
  codigo_barras?: string | null;
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

interface Cliente {
  id: number;
  nome: string;
  saldo_devedor: string;
}

interface DadosCupom {
  itens: ItemCarrinho[];
  total: number;
  pagamento: string;
  data: string;
  valorRecebido?: number;
  troco?: number;
  clienteNome?: string; // Novo: para sair no papel
}

export default function PDV() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<string>('DINHEIRO');
  const [cupomImpressao, setCupomImpressao] = useState<DadosCupom | null>(null);

  // Estados do Caixa (Turno)
  const [caixaAtual, setCaixaAtual] = useState<{ id: number; valor_abertura: string } | null>(null);
  const [carregandoCaixa, setCarregandoCaixa] = useState(true);
  const [valorAbertura, setValorAbertura] = useState('');
  const [valorFechamento, setValorFechamento] = useState('');
  const [modalFechamento, setModalFechamento] = useState(false);

  // Modal de Pagamento
  const [modalPagamento, setModalPagamento] = useState(false);
  const [valorRecebido, setValorRecebido] = useState('');

  // === NOVOS ESTADOS PARA CLIENTES ===
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);

  // === ESTADO DO LEITOR DE CÓDIGO DE BARRAS ===
  const [codigoLeitura, setCodigoLeitura] = useState('');
  const leitorInputRef = useRef<HTMLInputElement>(null);

  const getUsuarioId = () => {
    const token = localStorage.getItem('token');
    if (!token) return 0;
    try { return JSON.parse(atob(token.split('.')[1])).sub; } catch (e) { return 0; }
  };
  const usuarioId = getUsuarioId();

  const carregarDadosIniciais = async () => {
    try {
      // Busca produtos e clientes ao mesmo tempo
      const [resProd, resCli] = await Promise.all([
        apiFetch('/products'),
        apiFetch('/customers')
      ]);
      
      if (resProd.ok) {
        const data = await resProd.json();
        setProdutos(data.filter((p: Produto) => p.ativo !== false));
      }
      
      if (resCli.ok) {
        setClientes(await resCli.json());
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    }
  };

  const verificarCaixa = async () => {
    if (!usuarioId) return;
    try {
      const res = await apiFetch(`/caixas/status/${usuarioId}`);
      if (res.ok) setCaixaAtual(await res.json() || null);
    } catch (err) { console.error(err); } finally { setCarregandoCaixa(false); }
  };

  useEffect(() => { 
    verificarCaixa(); 
    carregarDadosIniciais(); 
  }, []);

  const abrirCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/caixas/abrir', { method: 'POST', body: JSON.stringify({ usuario_id: usuarioId, valor_abertura: Number(valorAbertura) }) });
    if (res.ok) { alert('✅ Caixa aberto com sucesso!'); verificarCaixa(); }
  };

  const fecharCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caixaAtual || !window.confirm("Deseja encerrar o turno?")) return;
    const res = await apiFetch('/caixas/fechar', { method: 'POST', body: JSON.stringify({ caixa_id: caixaAtual.id, valor_fechamento_informado: Number(valorFechamento) }) });
    if (res.ok) {
      const { diferenca } = await res.json();
      const dif = Number(diferenca);
      alert(`✅ Caixa fechado!\n${dif < 0 ? `Faltou R$ ${Math.abs(dif).toFixed(2)}` : dif > 0 ? `Sobrou R$ ${dif.toFixed(2)}` : 'O dinheiro bateu perfeitamente.'}`);
      setModalFechamento(false); setCaixaAtual(null);
    }
  };

  const obterEstoque = (produto: Produto): number => {
    if (!produto.stock) return 0;
    if (Array.isArray(produto.stock)) return produto.stock.length > 0 ? Number(produto.stock[0].quantidade) : 0;
    return Number(produto.stock.quantidade);
  };

  const adicionarAoCarrinho = (produto: Produto, quantidadeAdicionada: number = 1) => {
    const preco = Number(produto.preco_venda);
    const estoqueDisponivel = obterEstoque(produto);

    setCarrinho((atual) => {
      const itemExistente = atual.find(item => item.produto_id === produto.id);
      if (itemExistente) {
        const novaQtd = itemExistente.quantidade + quantidadeAdicionada;
        if (novaQtd > estoqueDisponivel) {
          alert(`Estoque insuficiente! Só restam ${estoqueDisponivel} unidades/kg.`);
          return atual;
        }
        return atual.map(item => item.produto_id === produto.id ? { ...item, quantidade: novaQtd, subtotal: novaQtd * item.preco_unitario } : item);
      } else {
        if (quantidadeAdicionada > estoqueDisponivel) {
          alert(`Estoque insuficiente! Só restam ${estoqueDisponivel} unidades/kg.`);
          return atual;
        }
        return [...atual, { produto_id: produto.id, nome: produto.nome, preco_unitario: preco, quantidade: quantidadeAdicionada, subtotal: preco * quantidadeAdicionada }];
      }
    });
  };

  const processarLeitura = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoLeitura) return;
    const codigo = codigoLeitura.trim();

    if (codigo.startsWith('2') && codigo.length === 13) {
      const codigoProdutoBalança = Number(codigo.substring(1, 6));
      const precoLidoBalança = Number(codigo.substring(6, 12)) / 100;
      const produtoEncontrado = produtos.find(p => p.id === codigoProdutoBalança || Number(p.codigo_barras) === codigoProdutoBalança);

      if (produtoEncontrado) {
        const pesoCalculado = precoLidoBalança / Number(produtoEncontrado.preco_venda);
        adicionarAoCarrinho(produtoEncontrado, pesoCalculado);
      } else { alert('Produto da balança não encontrado.'); }
    } else {
      const produtoEncontrado = produtos.find(p => p.codigo_barras === codigo);
      if (produtoEncontrado) { adicionarAoCarrinho(produtoEncontrado, 1); }
      else { alert('Produto não cadastrado!'); }
    }
    setCodigoLeitura('');
    leitorInputRef.current?.focus();
  };

  const removerDoCarrinho = (id: number) => setCarrinho(atual => atual.filter(item => item.produto_id !== id));

  const atualizarQuantidade = (produtoId: number, novaQuantidade: number) => {
    if (novaQuantidade <= 0) return; 
    const produtoBase = produtos.find(p => p.id === produtoId);
    const estoqueDisponivel = produtoBase ? obterEstoque(produtoBase) : 0;
    if (novaQuantidade > estoqueDisponivel) return alert(`Quantidade inválida! Só restam ${estoqueDisponivel} em estoque.`);
    setCarrinho(atual => atual.map(item => item.produto_id === produtoId ? { ...item, quantidade: novaQuantidade, subtotal: novaQuantidade * item.preco_unitario } : item));
  };

  const totalVenda = carrinho.reduce((acc, item) => acc + item.subtotal, 0);

  const abrirPagamento = () => { 
    if (!caixaAtual) return alert("Abra o caixa primeiro!"); 
    setValorRecebido(''); 
    setModalPagamento(true); 
  };

  const trocoCalculado = Number(valorRecebido) - totalVenda;
  // Regra: se for FIADO, precisa de cliente. Se for DINHEIRO, precisa de valor recebido suficiente.
  const pagamentoValido = 
    (formaPagamento === 'FIADO' && clienteSelecionado) ||
    (formaPagamento === 'DINHEIRO' && Number(valorRecebido) >= totalVenda) ||
    (formaPagamento !== 'DINHEIRO' && formaPagamento !== 'FIADO');

  const confirmarVenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pagamentoValido) return;

    const payload = { 
      forma_pagamento: formaPagamento, 
      caixa_id: caixaAtual?.id, 
      cliente_id: clienteSelecionado?.id, // Envia o cliente vinculado
      itens: carrinho.map(item => ({ produto_id: item.produto_id, quantidade: item.quantidade })) 
    };

    try {
      const response = await apiFetch('/sales', { method: 'POST', body: JSON.stringify(payload) });
      if (response.ok) {
        setCupomImpressao({ 
          itens: [...carrinho], 
          total: totalVenda, 
          pagamento: formaPagamento, 
          data: new Date().toLocaleString('pt-BR'), 
          valorRecebido: formaPagamento === 'DINHEIRO' ? Number(valorRecebido) : undefined, 
          troco: formaPagamento === 'DINHEIRO' ? trocoCalculado : undefined,
          clienteNome: clienteSelecionado?.nome
        });
        
        setModalPagamento(false); 
        setCarrinho([]); 
        setClienteSelecionado(null);
        carregarDadosIniciais(); // Recarrega para atualizar estoques e saldos devedores
        
        setTimeout(() => { window.print(); setTimeout(() => setCupomImpressao(null), 1000); }, 500);
      } else { 
        const errorData = await response.json();
        alert(`❌ Erro: ${errorData.message}`); 
      }
    } catch (error) { alert('❌ Erro de conexão com o servidor.'); }
  };

  if (carregandoCaixa) return <div className="p-10 text-center font-bold text-gray-500">Verificando status do caixa...</div>;
  if (!caixaAtual) { return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-gray-100 font-sans print:hidden">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-96 text-center border-t-8 border-red-500">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Caixa Fechado</h2>
          <form onSubmit={abrirCaixa} className="space-y-4">
            <div>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500 font-bold">R$</span>
                <input type="number" step="0.01" min="0" required value={valorAbertura} onChange={e => setValorAbertura(e.target.value)} className="w-full pl-10 p-3 border border-gray-300 rounded-lg outline-none font-bold text-lg" placeholder="Fundo de Troco" />
              </div>
            </div>
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-md cursor-pointer">Abrir Caixa</button>
          </form>
        </div>
      </div>
  );}

  return (
    <>
      <div className="flex h-[calc(100vh-64px)] bg-gray-100 font-sans overflow-hidden print:hidden relative">
        <button onClick={() => setModalFechamento(true)} className="absolute top-4 left-6 z-10 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors border border-red-200 cursor-pointer">
          🔒 Encerrar Turno
        </button>

        {/* Vitrine e Leitor */}
        <div className="w-2/3 p-6 pt-16 overflow-y-auto">
          <form onSubmit={processarLeitura} className="mb-6">
            <div className="relative">
              <span className="absolute left-4 top-4 text-xl">📻</span>
              <input 
                ref={leitorInputRef}
                type="text" 
                autoFocus
                placeholder="Biper código de barras aqui..." 
                value={codigoLeitura} 
                onChange={(e) => setCodigoLeitura(e.target.value)}
                className="w-full pl-12 p-4 border-2 border-blue-300 bg-blue-50 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all text-gray-700 font-bold shadow-sm"
              />
            </div>
          </form>

          <div className="grid grid-cols-3 gap-4">
            {produtos.map((produto) => {
              const estoque = obterEstoque(produto);
              const semEstoque = estoque <= 0;
              return (
                <button key={produto.id} onClick={() => adicionarAoCarrinho(produto)} disabled={semEstoque} className={`relative p-6 rounded-xl shadow text-left transition-all border ${semEstoque ? 'bg-gray-200 cursor-not-allowed opacity-60' : 'bg-white hover:bg-blue-50 active:scale-95 border-transparent cursor-pointer'}`}>
                  <h3 className="font-semibold text-gray-700 text-lg pr-12">{produto.nome}</h3>
                  <p className="text-blue-600 font-bold mt-2 text-xl">R$ {Number(produto.preco_venda).toFixed(2).replace('.', ',')}</p>
                  <span className={`absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full ${semEstoque ? 'bg-red-200 text-red-800' : 'bg-green-100 text-green-800'}`}>{estoque} un.</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lateral Direita */}
        <div className="w-1/3 bg-white border-l border-gray-200 shadow-2xl flex flex-col">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Cupom Atual</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {carrinho.length === 0 ? <p className="text-gray-400 text-center mt-10">O carrinho está vazio.</p> : carrinho.map((item) => (
              <div key={item.produto_id} className="flex justify-between items-start border-b border-gray-100 pb-4">
                <div className="flex-1">
                  <p className="font-semibold text-gray-700">{item.nome}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => atualizarQuantidade(item.produto_id, item.quantidade - 1)} disabled={item.quantidade <= 0.001} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded cursor-pointer">-</button>
                    <input type="number" step="0.001" min="0.001" value={Number(item.quantidade).toFixed(3)} onChange={(e) => atualizarQuantidade(item.produto_id, Number(e.target.value))} className="w-20 text-center border rounded p-1 outline-none font-bold" />
                    <button onClick={() => atualizarQuantidade(item.produto_id, item.quantidade + 1)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded cursor-pointer">+</button>
                    <p className="text-sm text-gray-500 ml-2">x R$ {item.preco_unitario.toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between h-full ml-4">
                  <button onClick={() => removerDoCarrinho(item.produto_id)} className="text-red-500 hover:text-red-700 font-bold cursor-pointer">X</button>
                  <p className="font-bold text-gray-800 mt-3">R$ {item.subtotal.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50">
            {/* SELEÇÃO DE CLIENTE */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Vincular Cliente</label>
              <select 
                className="w-full p-3 border rounded-lg bg-white outline-none font-medium text-gray-700"
                value={clienteSelecionado?.id || ''}
                onChange={(e) => {
                  const cli = clientes.find(c => c.id === Number(e.target.value));
                  setClienteSelecionado(cli || null);
                }}
              >
                <option value="">Consumidor Final</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome} (Débito: R$ {Number(c.saldo_devedor).toFixed(2)})</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Forma de Pagamento</label>
              <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className="w-full p-3 border rounded-lg bg-white outline-none cursor-pointer font-bold text-gray-700">
                <option value="DINHEIRO">💵 Dinheiro</option>
                <option value="PIX">💠 PIX</option>
                <option value="CARTAO_CREDITO">💳 Cartão de Crédito</option>
                <option value="FIADO">📘 FIADO / CONTA</option>
              </select>
            </div>
            
            <div className="flex justify-between items-center mb-6">
              <span className="text-xl font-bold text-gray-600">Total:</span>
              <span className="text-3xl font-extrabold text-blue-600">R$ {totalVenda.toFixed(2).replace('.', ',')}</span>
            </div>
            <button onClick={abrirPagamento} disabled={carrinho.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl text-xl transition-colors cursor-pointer shadow-lg">
              Receber Pagamento
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE PAGAMENTO */}
      {modalPagamento && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-[450px]">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-800">Finalizar Venda</h2>
              <button onClick={() => setModalPagamento(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl cursor-pointer">X</button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6 flex justify-between items-center border border-blue-100">
              <span className="font-bold text-blue-800">TOTAL:</span>
              <span className="text-2xl font-extrabold text-blue-600">R$ {totalVenda.toFixed(2).replace('.', ',')}</span>
            </div>

            <form onSubmit={confirmarVenda}>
              {formaPagamento === 'DINHEIRO' ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Valor Recebido:</label>
                    <div className="relative">
                      <span className="absolute left-4 top-4 text-gray-500 font-bold text-xl">R$</span>
                      <input type="number" step="0.01" min="0" required autoFocus value={valorRecebido} onChange={e => setValorRecebido(e.target.value)} className="w-full pl-12 p-4 border-2 border-gray-300 rounded-xl outline-none focus:border-green-500 font-bold text-2xl text-gray-800" placeholder="0.00" />
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg mb-6 flex justify-between items-center border ${trocoCalculado >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <span className={`font-bold ${trocoCalculado >= 0 ? 'text-green-800' : 'text-red-800'}`}>TROCO:</span>
                    <span className={`text-2xl font-extrabold ${trocoCalculado >= 0 ? 'text-green-600' : 'text-red-500'}`}>{trocoCalculado >= 0 ? `R$ ${trocoCalculado.toFixed(2).replace('.', ',')}` : 'Insuficiente'}</span>
                  </div>
                </>
              ) : formaPagamento === 'FIADO' ? (
                <div className="mb-6 p-6 bg-red-50 border-2 border-dashed border-red-200 rounded-xl text-center">
                   <p className="text-red-800 font-bold text-lg mb-2">Venda a Prazo</p>
                   <p className="text-sm text-red-600">O valor será somado à conta de:</p>
                   <p className="text-xl font-extrabold text-red-700">{clienteSelecionado?.nome || '---'}</p>
                </div>
              ) : (
                <div className="text-center mb-6 p-6 border-2 border-dashed border-gray-300 rounded-xl">
                  <span className="text-4xl mb-2 block">{formaPagamento === 'PIX' ? '💠' : '💳'}</span>
                  <p className="font-bold text-gray-600">Confirme o pagamento {formaPagamento}</p>
                </div>
              )}
              <button type="submit" disabled={!pagamentoValido} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl text-xl cursor-pointer shadow-lg">
                Confirmar e Imprimir
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FECHAMENTO CAIXA */}
      {modalFechamento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-[400px]">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 border-b pb-2">Encerrar Turno</h2>
            <form onSubmit={fecharCaixa} className="space-y-4 pt-4">
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500 font-bold">R$</span>
                <input type="number" step="0.01" min="0" required value={valorFechamento} onChange={e => setValorFechamento(e.target.value)} className="w-full pl-10 p-3 border border-gray-300 rounded-lg outline-none font-bold text-xl text-blue-600" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setModalFechamento(false)} className="w-1/2 bg-gray-200 font-bold py-3 rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="w-1/2 bg-red-600 text-white font-bold py-3 rounded-xl cursor-pointer">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPRESSÃO DO CUPOM */}
      {cupomImpressao && (
        <div className="hidden print:block font-mono text-[12px] text-black w-[80mm] mx-auto bg-white p-2">
          <div className="text-center mb-4">
            <h1 className="font-bold text-[16px]">MINHA PADARIA SaaS</h1>
            <p className="text-[10px]">CUPOM NÃO FISCAL</p>
            <p className="text-[10px]">Data: {cupomImpressao.data}</p>
          </div>
          
          {cupomImpressao.clienteNome && (
            <div className="mb-2 text-[10px] border border-black p-1">
              CLIENTE: {cupomImpressao.clienteNome.toUpperCase()}
            </div>
          )}

          <p className="text-[10px] mb-1">--------------------------------</p>
          <div className="flex justify-between font-bold text-[10px] mb-1">
            <span className="w-3/5">DESCRIÇÃO</span>
            <span className="w-1/5 text-center">QTD/KG</span>
            <span className="w-1/5 text-right">TOTAL</span>
          </div>
          <p className="text-[10px] mb-2">--------------------------------</p>
          <div className="mb-4">
            {cupomImpressao.itens.map((item, index) => (
              <div key={index} className="flex justify-between text-[11px] mb-1">
                <span className="w-3/5 truncate pr-1">{item.nome}</span>
                <span className="w-1/5 text-center">{item.quantidade % 1 !== 0 ? item.quantidade.toFixed(3) : item.quantidade}</span>
                <span className="w-1/5 text-right">{item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] mb-2">--------------------------------</p>
          <div className="flex justify-between font-bold text-[14px] mb-1"><span>TOTAL:</span><span>R$ {cupomImpressao.total.toFixed(2).replace('.', ',')}</span></div>
          <div className="flex justify-between text-[11px] mb-2"><span>PAGAMENTO:</span><span>{cupomImpressao.pagamento.replace('_', ' ')}</span></div>
          
          {cupomImpressao.pagamento === 'DINHEIRO' && cupomImpressao.valorRecebido !== undefined && (
            <>
              <div className="flex justify-between text-[11px] mb-1 text-gray-600"><span>RECEBIDO:</span><span>R$ {cupomImpressao.valorRecebido.toFixed(2).replace('.', ',')}</span></div>
              <div className="flex justify-between font-bold text-[11px] mb-4"><span>TROCO:</span><span>R$ {cupomImpressao.troco?.toFixed(2).replace('.', ',')}</span></div>
            </>
          )}

          <div className="text-center mt-6 font-bold"><p className="text-[10px]">OBRIGADO PELA PREFERÊNCIA!</p></div>
        </div>
      )}
    </>
  );
}