// Arquivo: src/services/orderService.js (VERSÃO FINAL)

import { API_BASE_URL, processResponse, createAuthHeaders } from './api';

export const orderService = {
    /**
     * Busca a lista de pedidos, aplicando filtros.
     * @param {URLSearchParams} params - Os parâmetros de filtro (datas, ordenação).
     */
    getOrders: async (params) => {
        // Construímos a URL com os parâmetros de busca
        const response = await fetch(`${API_BASE_URL}/orders?${params.toString()}`, {
            headers: createAuthHeaders()
        });
        const data = await processResponse(response);
        return data.data;
    },

    /**
     * Busca os detalhes de um pedido específico.
     * @param {string} orderId - O ID do pedido.
     */
    getOrderDetails: async (orderId) => {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
            headers: createAuthHeaders()
        });
        const data = await processResponse(response);
        return data.data;
    },

    /**
     * Atualiza o status de um pedido.
     * @param {string} orderId - O ID do pedido a ser atualizado.
     * @param {string} newStatus - O novo status do pedido.
     */
    updateOrderStatus: async (orderId, newStatus) => {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
            // ✅ CORREÇÃO: Alterado de 'POST' para 'PUT' para corresponder ao backend.
            method: 'PUT',
            headers: { ...createAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        return processResponse(response);
    },
};