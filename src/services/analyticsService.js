// Arquivo: src/services/analyticsService.js (NOVO)

import { API_BASE_URL, processResponse, createAuthHeaders } from './api';

export const analyticsService = {
    /**
     * Busca os dados de analytics do backend.
     * Chama a rota GET /api/analytics que criámos no backend.
     */
    getAnalytics: async () => {
        const headers = createAuthHeaders();
        // Validação para garantir que o token existe antes de fazer a chamada
        if (!headers.Authorization) {
            throw new Error("Utilizador não autenticado. Impossível buscar dados de analytics.");
        }

        const response = await fetch(`${API_BASE_URL}/analytics`, { 
            headers: headers 
        });
        
        const data = await processResponse(response);
        return data.data; // Retorna o objeto de dados da resposta
    },
};