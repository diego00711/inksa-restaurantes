// src/services/api.js (Versão Híbrida — fetch + axios, com renovação de sessão)

import axios from 'axios';

// --- Configuração de URLs e Chaves ---
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
const REFRESH_TOKEN_KEY = 'restaurantRefreshToken';

// =======================================================================
// SESSÃO: expiração + renovação (usado tanto pelo axios quanto pelo apiClient)
// Antes o app só DETECTAVA o token expirado e deslogava (~1h de sessão) — o
// restaurante reclamou de deslogar sozinho. Agora renova via refresh_token.
// =======================================================================

export const REFRESH_NETWORK_ERROR = 'REFRESH_NETWORK_ERROR';

function decodeJwtPayload(token) {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    return JSON.parse(atob(b64 + pad));
  } catch {
    return null;
  }
}

// margem generosa: renova 60s antes de vencer, pra nunca mandar token morto
export function isTokenExpired(token, marginSeconds = 60) {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  return Math.floor(Date.now() / 1000) >= payload.exp - marginSeconds;
}

export function clearSession() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {}
}

// Uma única renovação em voo (várias telas ao mesmo tempo -> 1 request só)
let refreshPromise = null;

/**
 * Troca o refresh_token por um access_token novo (POST /api/auth/refresh).
 * @returns {Promise<string|null|'REFRESH_NETWORK_ERROR'>}
 *   token novo | null (sessão inválida -> deslogar) | REFRESH_NETWORK_ERROR
 */
export async function refreshSession() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const r = await fetch(`${AUTH_API_URL || RESTAURANT_API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!r.ok) return null; // 401: refresh_token revogado/inválido
      const json = await r.json();
      const token = json?.data?.token;
      const newRefresh = json?.data?.refresh_token;
      if (!token) return null;
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      if (newRefresh) localStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);
      return token;
    } catch {
      return REFRESH_NETWORK_ERROR; // backend hibernando/wifi caiu: NÃO desloga
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// =======================================================================
// PARTE 1: SUPORTE AO CÓDIGO ANTIGO (fetch)
// =======================================================================

/**
 * Cria os cabeçalhos de autenticação para chamadas `fetch`.
 */
export const createAuthHeaders = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

/**
 * Processa a resposta de uma chamada `fetch`.
 */
export const processResponse = async (response) => {
  // 401 aqui = sessão definitivamente inválida (o apiClient já tentou renovar)
  if (response.status === 401) {
    clearSession();
    window.location.href = '/login';
    return null;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = error.message || error.error || `HTTP ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};


// =======================================================================
// PARTE 2: SUPORTE AO CÓDIGO NOVO (axios) — orderService etc.
// =======================================================================

const api = axios.create({
  baseURL: RESTAURANT_API_URL,
});

// Request: injeta o token; se estiver vencendo, RENOVA antes de mandar.
api.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token && isTokenExpired(token)) {
      const renewed = await refreshSession();
      if (renewed && renewed !== REFRESH_NETWORK_ERROR) token = renewed;
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response: em 401, renova e REFAZ a chamada 1x; só desloga se a renovação
// falhar de vez (refresh_token inválido). Antes, qualquer 401 deslogava.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response && error.response.status === 401 && original && !original._retry) {
      original._retry = true;
      const renewed = await refreshSession();
      if (renewed && renewed !== REFRESH_NETWORK_ERROR) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${renewed}`;
        return api(original);
      }
      if (renewed !== REFRESH_NETWORK_ERROR) {
        // sessão inválida (não foi só falha de rede) -> desloga
        clearSession();
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

// Exportação padrão da instância do axios
export default api;

// Exportações nomeadas
export {
  AUTH_API_URL,
  RESTAURANT_API_URL,
  AUTH_TOKEN_KEY,
  USER_DATA_KEY,
  REFRESH_TOKEN_KEY,
};
