import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  limite_credito: string;
  saldo_devedor: string;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [limite, setLimite] = useState('100');
  const [mostrarModal, setMostrarModal] = useState(false);

  const carregarClientes = async () => {
    const res = await apiFetch('/customers');
    if (res.ok) setClientes(await res.json());
  };

  useEffect(() => { carregarClientes(); }, []);

  const cadastrarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/customers', {
      method: 'POST',
      body: JSON.stringify({ nome, telefone, limite_credito: Number(limite) })
    });

    if (res.ok) {
      alert('Cliente cadastrado!');
      setNome(''); setTelefone(''); setLimite('100');
      setMostrarModal(false);
      carregarClientes();
    }
  };

  const pagarConta = async (id: number) => {
    const valor = prompt("Quanto o cliente está pagando agora?");
    if (!valor || isNaN(Number(valor))) return;

    const res = await apiFetch(`/customers/${id}/pagar`, {
      method: 'POST',
      body: JSON.stringify({ valor: Number(valor) })
    });

    if (res.ok) {
      alert('Pagamento registrado com sucesso!');
      carregarClientes();
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">👥 Gestão de Clientes (Fiado)</h2>
        <button 
          onClick={() => setMostrarModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all cursor-pointer"
        >
          + Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold">
            <tr>
              <th className="p-4">Nome</th>
              <th className="p-4">Contato</th>
              <th className="p-4">Limite</th>
              <th className="p-4">Saldo Devedor</th>
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map(c => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4 font-semibold text-gray-700">{c.nome}</td>
                <td className="p-4 text-gray-500">{c.telefone || '---'}</td>
                <td className="p-4 text-gray-500 text-sm">R$ {Number(c.limite_credito).toFixed(2)}</td>
                <td className={`p-4 font-bold ${Number(c.saldo_devedor) > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  R$ {Number(c.saldo_devedor).toFixed(2)}
                </td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => pagarConta(c.id)}
                    className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold text-xs hover:bg-green-600 hover:text-white transition-all cursor-pointer"
                  >
                    RECEBER PAGAMENTO
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE CADASTRO */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-96">
            <h3 className="text-xl font-bold mb-6">Novo Cliente</h3>
            <form onSubmit={cadastrarCliente} className="space-y-4">
              <input type="text" placeholder="Nome Completo" required value={nome} onChange={e => setNome(e.target.value)} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              <div>
                <label className="text-xs font-bold text-gray-400">Limite de Crédito (Fiado)</label>
                <input type="number" value={limite} onChange={e => setLimite(e.target.value)} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setMostrarModal(false)} className="w-1/2 p-3 bg-gray-100 font-bold rounded-xl">Cancelar</button>
                <button type="submit" className="w-1/2 p-3 bg-blue-600 text-white font-bold rounded-xl">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}