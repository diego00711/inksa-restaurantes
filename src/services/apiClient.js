// src/services/apiClient.js
// Wrapper global de fetch com interceptação de erros 401/403.

import { AUTH_TOKEN_KEY } from './api';

export async function apiFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return response;
  } catch (error) {
    window.dispatchEvent(new CustomEvent('network:error'));
    throw error;
  }
}
