// src/utils/api.ts
// Esta função substitui o 'fetch' padrão e já injeta o Token automaticamente.

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`http://localhost:3000${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Se o token expirar ou for inválido, o servidor devolve 401 (Não Autorizado)
    localStorage.removeItem('token');
    localStorage.removeItem('user_perfil');
    window.location.href = '/login'; // Expulsa para o login
  }

  return response;
}