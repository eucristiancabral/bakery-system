import { useEffect, useState } from 'react';
import './index.css';

interface Produto {
  id: number;
  nome: string;
  preco_venda: string;
}

interface ItemCarrinho {
  produto_id: number;
  nome: string;
  preco_unitario: number;
  quantidade: number;
  subtotal: number;
}

function App() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  
  // NOVO: Estado para a forma de pagamento (O padrão é PIX)
  const [formaPagamento, setFormaPagamento] = useState<string>('PIX');

  useEffect(() => {
    fetch('http://localhost:3000/products')
      .then((response) => response.json())
      .then((data) => setProdutos(data))
      .catch((error) => console.error("Erro ao buscar a API:", error));
  }, []);

  const adicionarAoCarrinho = (produto: Produto) => {
    const preco = Number(produto.preco_venda);
    setCarrinho((carrinhoAtual) => {
      const itemExistente = carrinhoAtual.find(item => item.produto_id === produto.id);
      if (itemExistente) {
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

  const totalVenda = carrinho.reduce((acumulador, item) => acumulador + item.subtotal, 0);

  // NOVO: A função que conecta o React ao NestJS!
  const finalizarVenda = async () => {
    // 1. Montamos o JSON no formato exato do nosso CreateSaleDto
    const payload = {
      forma_pagamento: formaPagamento,
      itens: carrinho.map(item => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade
      }))
    };

    try {
      // 2. Disparamos o POST para o Backend
      const response = await fetch('http://localhost:3000/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('✅ Venda finalizada com sucesso! O estoque foi atualizado.');
        setCarrinho([]); // Limpa o carrinho para o próximo cliente
        setFormaPagamento('PIX'); // Reseta o pagamento
      } else {
        const errorData = await response.json();
        alert(`❌ Erro ao vender: ${errorData.message}`);
      }
    } catch (error) {
      alert('❌ Erro de conexão com o servidor.');
      console.error(error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      
      {/* Vitrine */}
      <div className="w-2/3 p-6 overflow-y-auto">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Vitrine</h2>
        <div className="grid grid-cols-3 gap-4">
          {produtos.map((produto) => (
            <button 
              key={produto.id} 
              onClick={() => adicionarAoCarrinho(produto)}
              className="bg-white p-6 rounded-xl shadow text-left cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all border border-transparent active:scale-95"
            >
              <h3 className="font-semibold text-gray-700 text-lg">{produto.nome}</h3>
              <p className="text-blue-600 font-bold mt-2 text-xl">
                R$ {Number(produto.preco_venda).toFixed(2).replace('.', ',')}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Cupom Fiscal */}
      <div className="w-1/3 bg-white border-l border-gray-200 shadow-2xl flex flex-col">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-800">Cupom Fiscal</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {carrinho.length === 0 ? (
            <p className="text-gray-400 text-center mt-10">O carrinho está vazio.</p>
          ) : (
            carrinho.map((item, index) => (
              <div key={index} className="flex justify-between items-center border-b border-gray-100 pb-2">
                <div>
                  <p className="font-semibold text-gray-700">{item.nome}</p>
                  <p className="text-sm text-gray-500">{item.quantidade}x R$ {item.preco_unitario.toFixed(2).replace('.', ',')}</p>
                </div>
                <p className="font-bold text-gray-800">
                  R$ {item.subtotal.toFixed(2).replace('.', ',')}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          
          {/* NOVO: Seletor de Pagamento */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-600 mb-2">Forma de Pagamento</label>
            <select 
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PIX">PIX</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="CARTAO_CREDITO">Cartão de Crédito</option>
              <option value="CARTAO_DEBITO">Cartão de Débito</option>
            </select>
          </div>

          <div className="flex justify-between items-center mb-6">
            <span className="text-xl font-bold text-gray-600">Total:</span>
            <span className="text-3xl font-extrabold text-blue-600">
              R$ {totalVenda.toFixed(2).replace('.', ',')}
            </span>
          </div>
          
          <button 
            onClick={finalizarVenda} // NOVO: Dispara a função
            disabled={carrinho.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl text-xl shadow-lg transition-colors active:bg-blue-800"
          >
            Finalizar Venda
          </button>
        </div>
      </div>

    </div>
  );
}

export default App;