// src/services/api.js
// Configuração central de APIs e utilitários de requisições para o Portal do Restaurante.
// Observação: as variáveis VITE_* devem apontar para o domínio (sem o sufixo /api).
// Ex.: VITE_API_URL=https://api.inksadelivery.com.br

// Caso você use um único backend para tudo (auth + restaurante), basta definir VITE_API_URL.
// Caso use serviços separados, defina VITE_AUTH_API_URL e VITE_RESTAURANT_API_URL.

const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL ||
  import.meta.env.VITE_API_URL ||
  'https://api.inksadelivery.com.br';

const RESTAURANT_API_URL =
  import.meta.env.VITE_RESTAURANT_API_URL ||
  import.meta.env.VITE_API_URL ||
  'https://api.inksadelivery.com.br';

// Compatibilidade com código legado que ainda importa { API_BASE_URL }.
// Por padrão, considere a base de "restaurante".
const API_BASE_URL = RESTAURANT_API_URL;

// Chaves usadas no armazenamento local
const AUTH_TOKEN_KEY = 'restaurantAuthToken';
const USER_DATA_KEY = 'restaurantUser';

/**
 * Processa a resposta de uma chamada fetch.
 * - Redireciona para /login em caso de 401 (sessão expirada).
 * - Tenta extrair mensagem de erro quando !ok.
 * - Suporta 204 (sem conteúdo).
 */
export const processResponse = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    // Redireciona imediatamente para a tela de login
    window.location.href = '/login';
    throw new Error('Sessão expirada. Por favor, faça login novamente.');
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody.message || errorBody.error || `Erro HTTP ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

/**
 * Cria o cabeçalho de Autorização para rotas protegidas.
 */
export const createAuthHeaders = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

export {
  AUTH_API_URL,
  RESTAURANT_API_URL,
  API_BASE_URL, // legado
  AUTH_TOKEN_KEY,
  USER_DATA_KEY,
};
