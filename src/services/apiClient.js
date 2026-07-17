// src/services/apiClient.js
// Wrapper global de fetch com:
//  1. Renovação automática da sessão (refresh_token) ANTES do token vencer
//  2. Retry único em 401 (renova e repete a chamada)
//  3. Logout SÓ quando a sessão é definitivamente inválida
//
// A lógica de expiração/renovação vive na api.js (compartilhada com o axios).

import {
  AUTH_TOKEN_KEY,
  isTokenExpired,
  refreshSession,
  clearSession,
  REFRESH_NETWORK_ERROR,
} from './api';

function expireSessionLocally() {
  clearSession();
  window.dispatchEvent(new CustomEvent('auth:unauthorized'));
}

function withAuthHeader(init, token) {
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  return { ...init, headers };
}

function makeResponse(status, message) {
  return new Response(JSON.stringify({ status: 'error', error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export { isTokenExpired };

export async function apiFetch(url, options = {}) {
  let token = localStorage.getItem(AUTH_TOKEN_KEY);

  // 1) Token vencendo? renova ANTES de chamar (em vez de deslogar).
  if (token && isTokenExpired(token)) {
    const renewed = await refreshSession();
    if (renewed === REFRESH_NETWORK_ERROR) {
      // rede fora: 503 (não 401) mantém a sessão viva pra próxima tentativa
      return makeResponse(503, 'Sem conexão. Tentando novamente...');
    }
    if (!renewed) {
      expireSessionLocally();
      return makeResponse(401, 'Sessão expirada');
    }
    token = renewed;
  }

  const doFetch = (tk) => fetch(url, tk ? withAuthHeader(options, tk) : options);

  let response;
  try {
    response = await doFetch(token);
  } catch (error) {
    window.dispatchEvent(new CustomEvent('network:error'));
    throw error;
  }

  // 2) 401 mesmo com token fresco? renova e tenta 1x.
  if (response.status === 401) {
    const renewed = await refreshSession();
    if (renewed === REFRESH_NETWORK_ERROR) return response;
    if (renewed) {
      try {
        response = await doFetch(renewed);
      } catch (error) {
        window.dispatchEvent(new CustomEvent('network:error'));
        throw error;
      }
      if (response.status !== 401) return response;
    }
    // renovação falhou de vez -> sessão inválida
    expireSessionLocally();
  }

  return response;
}
