// src/services/analyticsService.js
// Serviço de Analytics do Portal do Restaurante

import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

export const analyticsService = {
  /**
   * Busca os dados de analytics do backend.
   * GET /api/analytics
   * @param {AbortSignal} [signal] - opcional para cancelar a requisição
   * @returns {Promise<any>}
   */
  getAnalytics: async (signal) => {
    const headers = createAuthHeaders();

    // Garante que o usuário está autenticado
    if (!headers.Authorization) {
      throw new Error('Utilizador não autenticado. Impossível buscar dados de analytics.');
    }

    const response = await fetch(`${RESTAURANT_API_URL}/api/analytics`, {
      headers,
      signal,
    });

    const data = await processResponse(response);
    // Alguns backends retornam { data: ... }, outros já retornam o objeto direto
    return data?.data ?? data;
  },
};
