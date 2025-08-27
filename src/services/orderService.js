// src/services/orderService.js
// Serviço de pedidos do Portal do Restaurante

import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

export const orderService = {
  /**
   * Busca a lista de pedidos, aplicando filtros.
   * @param {URLSearchParams|Object} [params] - Parâmetros de filtro (datas, ordenação, etc.)
   * @param {AbortSignal} [signal] - Opcional para cancelar a requisição
   */
  getOrders: async (params, signal) => {
    const qs =
      params && typeof params.toString === 'function'
        ? params.toString()
        : new URLSearchParams(params || {}).toString();

    const url = `${RESTAURANT_API_URL}/api/orders${qs ? `?${qs}` : ''}`;

    const response = await fetch(url, {
      headers: createAuthHeaders(),
      signal,
    });
    const data = await processResponse(response);
    return data?.data ?? data;
  },

  /**
   * Busca os detalhes de um pedido específico.
   * @param {string} orderId - O ID do pedido.
   * @param {AbortSignal} [signal] - Opcional para cancelar a requisição
   */
  getOrderDetails: async (orderId, signal) => {
    const response = await fetch(
      `${RESTAURANT_API_URL}/api/orders/${encodeURIComponent(orderId)}`,
      {
        headers: createAuthHeaders(),
        signal,
      }
    );
    const data = await processResponse(response);
    return data?.data ?? data;
  },

  /**
   * Atualiza o status de um pedido.
   * @param {string} orderId - O ID do pedido a ser atualizado.
   * @param {string} newStatus - O novo status do pedido.
   */
  updateOrderStatus: async (orderId, newStatus) => {
    const response = await fetch(
      `${RESTAURANT_API_URL}/api/orders/${encodeURIComponent(orderId)}/status`,
      {
        method: 'PUT', // alinhado ao backend
        headers: { ...createAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      }
    );
    return processResponse(response);
  },
};
