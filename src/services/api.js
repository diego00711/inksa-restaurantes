// src/services/api.js (Versão Híbrida)

import axios from 'axios';

// --- Configuração de URLs e Chaves (sem alterações) ---
const RESTAURANT_API_URL =
  import.meta.env.VITE_RESTAURANT_API_URL ||
  import.meta.env.VITE_API_URL ||
  '';

const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL ||
  RESTAURANT_API_URL ||
  '';

const AUTH_TOKEN_KEY = 'restaurantAuthToken';
const USER_DATA_KEY = 'restaurantUser';

// =======================================================================
// PARTE 1: SUPORTE AO CÓDIGO ANTIGO (fetch)
// As funções que estavam faltando são adicionadas de volta e exportadas.
// =======================================================================

/**
 * Cria os cabeçalhos de autenticação para chamadas `fetch`.
 * @returns {object} - Objeto de cabeçalho com ou sem token.
 */
export const createAuthHeaders = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

/**
 * Processa a resposta de uma chamada `fetch`.
 * @param {Response} response - O objeto de resposta do fetch.
 * @returns {Promise<any>} - Os dados da resposta em JSON.
 */
export const processResponse = async (response) => {
  // Trata erro de autenticação (token expirado/inválido)
  if (response.status === 401) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    window.location.href = '/login';
    return null;
  }

  // Trata outros erros HTTP
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = error.message || error.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  // Trata respostas sem conteúdo (ex: DELETE bem-sucedido)
  if (response.status === 204) {
    return null;
  }

  return response.json();
};


// =======================================================================
// PARTE 2: SUPORTE AO CÓDIGO NOVO (axios)
// A instância `api` do axios continua aqui para o `orderService`.
// =======================================================================

const api = axios.create({
  baseURL: RESTAURANT_API_URL,
});

// Interceptor para adicionar o token automaticamente nas chamadas do `axios`.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar erros 401 automaticamente nas chamadas do `axios`.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

// Exportação padrão da instância do axios
export default api;

// Exportações nomeadas para as constantes e funções antigas
export {
  AUTH_API_URL,
  RESTAURANT_API_URL,
  AUTH_TOKEN_KEY,
  USER_DATA_KEY,
};
