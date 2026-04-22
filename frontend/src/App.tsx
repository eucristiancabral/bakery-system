import './index.css';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import PDV from './pages/PDV';
import Admin from './pages/Admin';
import Relatorios from './pages/Relatorios';
import Clientes from './pages/Clientes'; // <-- NOVA IMPORTAÇÃO
import Login from './pages/Login';

// COMPONENTE DE PROTEÇÃO DE ROTA
const RotaProtegida = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// COMPONENTE DE MENU
const MenuNavegacao = () => {
  const navigate = useNavigate();
  const perfil = localStorage.getItem('user_perfil');

  const fazerLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_perfil');
    navigate('/login');
  };

  return (
    <nav className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-md print:hidden">
      <div className="flex gap-6">
        <Link to="/" className="hover:text-blue-400 font-bold transition-colors">🛒 Caixa (PDV)</Link>
        
        {perfil === 'ADMIN' && (
          <>
            <Link to="/admin" className="hover:text-blue-400 font-bold transition-colors">⚙️ Gestão</Link>
            {/* NOVO LINK DE CLIENTES */}
            <Link to="/clientes" className="hover:text-blue-400 font-bold transition-colors">👥 Clientes</Link>
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
        {/* ROTA PÚBLICA */}
        <Route path="/login" element={<Login />} />

        {/* ROTAS PRIVADAS */}
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

        {/* NOVA ROTA DE CLIENTES */}
        <Route path="/clientes" element={
          <RotaProtegida>
            <>
              <MenuNavegacao />
              <Clientes />
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