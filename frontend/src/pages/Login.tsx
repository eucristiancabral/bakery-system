import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const navigate = useNavigate();

  const realizarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const res = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    if (res.ok) {
      const data = await res.ok ? await res.json() : null;
      // Guardamos o "crachá" e o perfil no navegador
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user_perfil', data.perfil);
      
      alert(`Bem-vindo, nível de acesso: ${data.perfil}`);
      navigate('/'); // Vai para o PDV
    } else {
      alert("E-mail ou senha incorretos.");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={realizarLogin} className="bg-white p-10 rounded-2xl shadow-2xl w-96">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Sua Padaria</h2>
        <div className="space-y-4">
          <input 
            type="email" placeholder="E-mail" 
            className="w-full p-3 border rounded-lg"
            onChange={e => setEmail(e.target.value)}
            required 
          />
          <input 
            type="password" placeholder="Senha" 
            className="w-full p-3 border rounded-lg"
            onChange={e => setSenha(e.target.value)}
            required 
          />
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
            Entrar no Sistema
          </button>
        </div>
      </form>
    </div>
  );
}