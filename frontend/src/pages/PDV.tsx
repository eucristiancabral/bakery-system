import { useEffect, useState } from 'react';

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

  // NOVO: Função para remover um item completamente
  const removerDoCarrinho = (produtoId: number) => {
    setCarrinho(carrinhoAtual => carrinhoAtual.filter(item => item.produto_id !== produtoId));
  };

  // NOVO: Função para atualizar a quantidade via botão ou input de texto
  const atualizarQuantidade = (produtoId: number, novaQuantidade: number) => {
    // Evita que o usuário digite zero ou números negativos no input
    if (novaQuantidade < 1) return; 

    setCarrinho(carrinhoAtual => 
      carrinhoAtual.map(item => 
        item.produto_id === produtoId
          ? { ...item, quantidade: novaQuantidade, subtotal: novaQuantidade * item.preco_unitario }
          : item
      )
    );
  };

  const totalVenda = carrinho.reduce((acumulador, item) => acumulador + item.subtotal, 0);

  const finalizarVenda = async () => {
    const payload = {
      forma_pagamento: formaPagamento,
      itens: carrinho.map(item => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade
      }))
    };

    try {
      const response = await fetch('http://localhost:3000/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('✅ Venda finalizada com sucesso!');
        setCarrinho([]); 
        setFormaPagamento('PIX'); 
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
            carrinho.map((item) => (
              <div key={item.produto_id} className="flex justify-between items-start border-b border-gray-100 pb-4">
                
                {/* Lado Esquerdo do Item: Nome e Controles */}
                <div className="flex-1">
                  <p className="font-semibold text-gray-700">{item.nome}</p>
                  
                  {/* Novo bloco de controles de quantidade */}
                  <div className="flex items-center gap-2 mt-2">
                    <button 
                      onClick={() => atualizarQuantidade(item.produto_id, item.quantidade - 1)}
                      disabled={item.quantidade <= 1}
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >-</button>
                    
                    <input 
                      type="number" 
                      min="1"
                      value={item.quantidade}
                      onChange={(e) => atualizarQuantidade(item.produto_id, Number(e.target.value))}
                      className="w-16 text-center border border-gray-300 rounded p-1 text-gray-700 outline-none focus:border-blue-500 font-semibold"
                    />
                    
                    <button 
                      onClick={() => atualizarQuantidade(item.produto_id, item.quantidade + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded cursor-pointer"
                    >+</button>

                    <p className="text-sm text-gray-500 ml-2">x R$ {item.preco_unitario.toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>

                {/* Lado Direito do Item: Botão X e Subtotal */}
                <div className="flex flex-col items-end justify-between h-full ml-4">
                  <button 
                    onClick={() => removerDoCarrinho(item.produto_id)}
                    className="text-red-500 hover:text-red-700 font-bold text-sm px-2 py-1 rounded hover:bg-red-100 cursor-pointer transition-colors"
                    title="Remover produto"
                  >
                    X
                  </button>
                  <p className="font-bold text-gray-800 mt-3">
                    R$ {item.subtotal.toFixed(2).replace('.', ',')}
                  </p>
                </div>

              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-600 mb-2">Forma de Pagamento</label>
            <select 
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              // ADICIONADO: cursor-pointer
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
            onClick={finalizarVenda} 
            disabled={carrinho.length === 0}
            // ADICIONADO: cursor-pointer e cursor-not-allowed quando bloqueado
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl text-xl shadow-lg transition-colors cursor-pointer disabled:cursor-not-allowed active:bg-blue-800"
          >
            Finalizar Venda
          </button>
        </div>
      </div>

    </div>
  );
}

export default App;