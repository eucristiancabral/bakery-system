import './index.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import PDV from './pages/PDV';
import Admin from './pages/Admin';

function App() {
  return (
    <BrowserRouter>
      {/* Menu de Navegação Simples */}
      <nav className="bg-gray-800 text-white p-4 flex gap-6 shadow-md">
        <Link to="/" className="hover:text-blue-400 font-bold">🛒 Caixa (PDV)</Link>
        <Link to="/admin" className="hover:text-blue-400 font-bold">⚙️ Gestão (Admin)</Link>
      </nav>

      <Routes>
        <Route path="/" element={<PDV />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;