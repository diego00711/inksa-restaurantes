// src/services/orderService.js
// Serviço de pedidos do Portal do Restaurante

import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

export const orderService = {
  /**
   * Busca a lista de pedidos, aplicando filtros.
   * @param {URLSearchParams|Object} [params]
   * @param {AbortSignal} [signal]
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
   * @param {string} orderId
   * @param {AbortSignal} [signal]
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
   * @param {string} orderId
   * @param {string} newStatus
   */
  updateOrderStatus: async (orderId, newStatus) => {
    // Mapeamento de status PT -> EN para o backend
    const statusMapping = {
      'Pendente': 'pending',
      'Aceito': 'accepted',
      'Preparando': 'preparing',
      'Pronto': 'ready',
      'Saiu para entrega': 'delivering',
      'Entregue': 'delivered',
      'Cancelado': 'cancelled'
    };

    // Converte o status para inglês antes de enviar
    const statusForBackend = statusMapping[newStatus] || newStatus;
    
    console.log(`🔄 Atualizando status do pedido ${orderId}`);
    console.log(`📝 Frontend (PT): ${newStatus} → Backend (EN): ${statusForBackend}`);
    
    const response = await fetch(
      `${RESTAURANT_API_URL}/api/orders/${encodeURIComponent(orderId)}/status`,
      {
        method: 'PUT',
        headers: { ...createAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusForBackend }),
      }
    );
    
    console.log(`📊 Resposta da API: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      console.error(`❌ Erro ao atualizar status:`, errorData);
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const result = await processResponse(response);
    console.log(`✅ Status atualizado com sucesso:`, result);
    return result;
  },

  /**
   * Busca os pedidos que foram entregues e estão pendentes de avaliação.
   * @param {string} restaurantId - O ID do restaurante logado.
   * @param {AbortSignal} [signal]
   */
  getOrdersPendingReview: async (restaurantId, signal) => {
    // IMPORTANTE: Confirme se a URL do seu backend para esta funcionalidade é esta.
    const url = `${RESTAURANT_API_URL}/api/orders/pending-review`;

    const response = await fetch(url, {
      headers: createAuthHeaders(),
      signal,
    });
    const data = await processResponse(response);
    // Retorna o array de pedidos diretamente.
    return data?.data ?? data;
  },
};
