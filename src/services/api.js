// src/services/api.js
// Centraliza URLs de API e utilitários de chamadas

// Se você tiver um único backend para tudo, use só VITE_API_URL.
// Caso contrário, use as duas variáveis abaixo.
const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL ||
  import.meta.env.VITE_API_URL || // fallback para setup com 1 backend
  '';

const RESTAURANT_API_URL =
  import.meta.env.VITE_RESTAURANT_API_URL ||
  import.meta.env.VITE_API_URL || // fallback para setup com 1 backend
  '';

// Chaves para armazenamento local (mantido por compatibilidade)
const AUTH_TOKEN_KEY = 'restaurantAuthToken';
const USER_DATA_KEY = 'restaurantUser';

// Tratamento padrão das respostas
export const processResponse = async (response) => {
  if (response.status === 401) {
    // sessão expirada
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    // redireciona para login
    window.location.href = '/login';
    return null;
  }

  if (!response.ok) {
    // tenta extrair mensagem de erro do backend
    const error = await response.json().catch(() => ({}));
    const message = error.message || error.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  // 204 no content
  if (response.status === 204) return null;

  return response.json();
};

// Cabeçalhos autenticados
export const createAuthHeaders = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

export {
  AUTH_API_URL,
  RESTAURANT_API_URL,
  AUTH_TOKEN_KEY,
  USER_DATA_KEY,
};
