import './index.css';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import PDV from './pages/PDV';
import Admin from './pages/Admin';
import Relatorios from './pages/Relatorios';
import Login from './pages/Login';

// COMPONENTE DE PROTEÇÃO DE ROTA (A Fechadura)
// Ele verifica se existe um token no localStorage. Se não existir, redireciona para o /login
const RotaProtegida = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// COMPONENTE DE MENU (Para podermos usar o useNavigate e fazer o Logout)
const MenuNavegacao = () => {
  const navigate = useNavigate();
  const perfil = localStorage.getItem('user_perfil');

  const fazerLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_perfil');
    navigate('/login');
  };

  return (
    // ADICIONADO 'print:hidden' AQUI PARA ESCONDER NA HORA DE IMPRIMIR O CUPOM
    <nav className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-md print:hidden">
      <div className="flex gap-6">
        <Link to="/" className="hover:text-blue-400 font-bold transition-colors">🛒 Caixa (PDV)</Link>
        
        {/* Futuramente, podemos esconder esses menus se o perfil for apenas 'CAIXA' */}
        {perfil === 'ADMIN' && (
          <>
            <Link to="/admin" className="hover:text-blue-400 font-bold transition-colors">⚙️ Gestão</Link>
            <Link to="/relatorios" className="hover:text-blue-400 font-bold transition-colors">📊 Relatórios</Link>
          </>
        )}
      </div>
      
      <button 
        onClick={fazerLogout}
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm cursor-pointer transition-colors"
      >
        Sair do Sistema
      </button>
    </nav>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ROTA PÚBLICA (Qualquer um acessa) */}
        <Route path="/login" element={<Login />} />

        {/* ROTAS PRIVADAS (Só com Token) */}
        <Route path="/" element={
          <RotaProtegida>
            <>
              <MenuNavegacao />
              <PDV />
            </>
          </RotaProtegida>
        } />
        
        <Route path="/admin" element={
          <RotaProtegida>
            <>
              <MenuNavegacao />
              <Admin />
            </>
          </RotaProtegida>
        } />
        
        <Route path="/relatorios" element={
          <RotaProtegida>
            <>
              <MenuNavegacao />
              <Relatorios />
            </>
          </RotaProtegida>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;