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

// Interface temporária para guardar os dados na hora da impressão
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
  
  // ESTADO NOVO: Guarda os dados da última venda para jogar na impressora
  const [cupomImpressao, setCupomImpressao] = useState<DadosCupom | null>(null);

  const obterEstoque = (produto: Produto): number => {
    if (!produto.stock) return 0;
    if (Array.isArray(produto.stock)) {
      return produto.stock.length > 0 ? Number(produto.stock[0].quantidade) : 0;
    }
    return Number(produto.stock.quantidade);
  };

  const carregarProdutos = () => {
    apiFetch('/products')
      .then((response) => response.json())
      .then((data: Produto[]) => setProdutos(data.filter(p => p.ativo !== false)))
      .catch((error) => console.error("Erro ao buscar a API:", error));
  };

  useEffect(() => { carregarProdutos(); }, []);

  const adicionarAoCarrinho = (produto: Produto) => {
    const preco = Number(produto.preco_venda);
    const estoqueDisponivel = obterEstoque(produto);

    setCarrinho((carrinhoAtual) => {
      const itemExistente = carrinhoAtual.find(item => item.produto_id === produto.id);
      
      if (itemExistente) {
        if (itemExistente.quantidade >= estoqueDisponivel) {
          alert(`Estoque insuficiente! Só restam ${estoqueDisponivel} unidades de ${produto.nome}.`);
          return carrinhoAtual;
        }
        return carrinhoAtual.map(item => 
          item.produto_id === produto.id 
            ? { ...item, quantidade: item.quantidade + 1, subtotal: (item.quantidade + 1) * item.preco_unitario }
            : item
        );
      } else {
        return [...carrinhoAtual, {
          produto_id: produto.id, nome: produto.nome, preco_unitario: preco, quantidade: 1, subtotal: preco
        }];
      }
    });
  };

  const removerDoCarrinho = (produtoId: number) => {
    setCarrinho(atual => atual.filter(item => item.produto_id !== produtoId));
  };

  const atualizarQuantidade = (produtoId: number, novaQuantidade: number) => {
    if (novaQuantidade < 1) return; 

    const produtoBase = produtos.find(p => p.id === produtoId);
    const estoqueDisponivel = produtoBase ? obterEstoque(produtoBase) : 0;

    if (novaQuantidade > estoqueDisponivel) {
      alert(`Quantidade inválida! Só restam ${estoqueDisponivel} unidades em estoque.`);
      return;
    }

    setCarrinho(atual => atual.map(item => 
        item.produto_id === produtoId
          ? { ...item, quantidade: novaQuantidade, subtotal: novaQuantidade * item.preco_unitario }
          : item
      )
    );
  };

  const totalVenda = carrinho.reduce((acc, item) => acc + item.subtotal, 0);

  const finalizarVenda = async () => {
    const payload = {
      forma_pagamento: formaPagamento,
      itens: carrinho.map(item => ({ produto_id: item.produto_id, quantidade: item.quantidade }))
    };

    try {
      const response = await apiFetch('/sales', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // 1. Salva os dados na memória para o Cupom ANTES de limpar o carrinho
        setCupomImpressao({
          itens: [...carrinho],
          total: totalVenda,
          pagamento: formaPagamento,
          data: new Date().toLocaleString('pt-BR')
        });

        alert('✅ Venda finalizada!');
        setCarrinho([]); 
        setFormaPagamento('PIX'); 
        carregarProdutos();

        // 2. Aciona a impressora térmica do sistema operacional
        setTimeout(() => {
          window.print();
          // Após imprimir (ou cancelar), limpamos o cupom da memória
          setTimeout(() => setCupomImpressao(null), 1000); 
        }, 500);

      } else {
        const errorData = await response.json();
        alert(`❌ Erro ao vender: ${errorData.message}`);
      }
    } catch (error) {
      alert('❌ Erro de conexão com o servidor.');
    }
  };

  return (
    <>
      {/* TELA NORMAL DO SISTEMA (Fica invisível na hora da impressão graças ao 'print:hidden') 
      */}
      <div className="flex h-[calc(100vh-64px)] bg-gray-100 font-sans overflow-hidden print:hidden">
        
        {/* Vitrine */}
        <div className="w-2/3 p-6 overflow-y-auto">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Vitrine</h2>
          <div className="grid grid-cols-3 gap-4">
            {produtos.map((produto) => {
              const estoque = obterEstoque(produto);
              const semEstoque = estoque <= 0;

              return (
                <button 
                  key={produto.id} 
                  onClick={() => adicionarAoCarrinho(produto)}
                  disabled={semEstoque}
                  className={`relative p-6 rounded-xl shadow text-left transition-all border 
                    ${semEstoque ? 'bg-gray-200 cursor-not-allowed opacity-60' : 'bg-white hover:bg-blue-50 active:scale-95 border-transparent'}`}
                >
                  <h3 className="font-semibold text-gray-700 text-lg pr-12">{produto.nome}</h3>
                  <p className="text-blue-600 font-bold mt-2 text-xl">R$ {Number(produto.preco_venda).toFixed(2).replace('.', ',')}</p>
                  <span className={`absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full ${semEstoque ? 'bg-red-200 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {estoque} un.
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cupom do Caixa */}
        <div className="w-1/3 bg-white border-l border-gray-200 shadow-2xl flex flex-col">
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-800">Cupom Atual</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {carrinho.length === 0 ? (
              <p className="text-gray-400 text-center mt-10">O carrinho está vazio.</p>
            ) : (
              carrinho.map((item) => (
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
              ))
            )}
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
            <button onClick={finalizarVenda} disabled={carrinho.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl text-xl transition-colors">
              Finalizar Venda
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================
        CUPOM FÍSICO DA IMPRESSORA TÉRMICA
        (Fica escondido na tela normal, visível APENAS no papel graças ao 'hidden print:block')
        Largura de 80mm é o padrão de impressoras térmicas (Epson, Elgin, etc)
        ========================================================================
      */}
      {cupomImpressao && (
        <div className="hidden print:block font-mono text-[12px] text-black w-[80mm] mx-auto bg-white p-2">
          
          {/* Cabeçalho da Padaria */}
          <div className="text-center mb-4">
            <h1 className="font-bold text-[16px]">MINHA PADARIA SaaS</h1>
            <p className="text-[10px]">Rua das Flores, 123 - Centro</p>
            <p className="text-[10px]">CNPJ: 00.000.000/0001-00</p>
            <p className="text-[10px]">--------------------------------</p>
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

          {/* Lista de Itens */}
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

          {/* Rodapé e Totais */}
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
            <p className="text-[10px]">Volte sempre!</p>
            <p className="text-[10px] mt-4">.</p> {/* Ponto de quebra para cortar papel */}
          </div>
          
        </div>
      )}
    </>
  );
}