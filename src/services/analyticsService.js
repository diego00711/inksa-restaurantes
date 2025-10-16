// src/services/analyticsService.js
// Serviço de Analytics do Portal do Restaurante

import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

export const analyticsService = {
  /**
   * Busca os dados de analytics do backend.
   * GET /api/analytics?days={days}
   * @param {number|string} [days=7] - Número de dias para filtrar (7, 30, 90, 365, ou 'all')
   * @param {AbortSignal} [signal] - opcional para cancelar a requisição
   * @returns {Promise<any>}
   */
  getAnalytics: async (days = 7, signal) => {
    const headers = createAuthHeaders();

    // Garante que o usuário está autenticado
    if (!headers.Authorization) {
      throw new Error('Utilizador não autenticado. Impossível buscar dados de analytics.');
    }

    // ✅ CORRIGIDO: Construir URL com query params
    const url = new URL(`${RESTAURANT_API_URL}/api/analytics`);
    
    // Adicionar o parâmetro 'days' na query string
    if (days && days !== 'all') {
      url.searchParams.append('days', days);
    }
    // Se for 'all', não envia o parâmetro (backend retorna tudo)

    console.log('📡 Buscando analytics:', url.toString());

    const response = await fetch(url.toString(), {
      headers,
      signal,
    });

    const data = await processResponse(response);
    
    console.log('📊 Resposta do analytics:', data);
    
    // Alguns backends retornam { data: ... }, outros já retornam o objeto direto
    return data?.data ?? data;
  },
};
