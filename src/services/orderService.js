// inksa-restaurantes/src/services/orderService.js  ✅ PATCH

import api from './api';

// --- Aliases e normalização ---
const ALIASES_TO_INTERNAL = {
  // aliases antigos/variações
  ready_for_pickup: 'accepted_by_delivery',
  out_for_delivery: 'delivering',
  saiu_para_entrega: 'delivering',
  aguardando_retirada: 'accepted_by_delivery',
};

// Conjunto de status internos válidos (iguais aos do backend)
const INTERNAL_VALID = new Set([
  'awaiting_payment',
  'pending',
  'accepted',
  'preparing',
  'ready',
  'accepted_by_delivery',
  'delivering',
  'delivered',
  'cancelled',
  'archived',
]);

// Mapeamento de status PT → EN (para quando vier em PT)
const statusMappingPTtoEN = {
  'Aguardando Pagamento': 'awaiting_payment',
  'Pendente': 'pending',
  'Aceito': 'accepted',
  'Preparando': 'preparing',
  'Pronto': 'ready',
  'Aguardando Retirada': 'accepted_by_delivery',
  'Saiu para Entrega': 'delivering',
  'Entregue': 'delivered',
  'Cancelado': 'cancelled',
  'Arquivado': 'archived',
};

// Mapeamento EN → PT (para exibir)
const statusMappingENtoPT = {
  awaiting_payment: 'Aguardando Pagamento',
  pending: 'Pendente',
  accepted: 'Aceito',
  preparing: 'Preparando',
  ready: 'Pronto',
  accepted_by_delivery: 'Aguardando Retirada',
  delivering: 'Saiu para Entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
  archived: 'Arquivado',
};

// Normaliza qualquer entrada (PT, EN ou alias) para o status interno aceito pelo backend
function normalizeToInternalStatus(anyStatus) {
  if (!anyStatus) return '';

  let s = String(anyStatus).trim();

  // 1) se veio em PT, converte
  if (statusMappingPTtoEN[s]) {
    s = statusMappingPTtoEN[s];
  }

  // 2) baixa para minúsculas para checar aliases
  const lower = s.toLowerCase();

  // 3) aplica alias se existir
  const aliased = ALIASES_TO_INTERNAL[lower] || lower;

  // 4) confere se é um status interno válido
  if (!INTERNAL_VALID.has(aliased)) {
    throw new Error(`Status inválido: ${anyStatus}`);
  }
  return aliased;
}

const translateOrderStatus = (order) => {
  if (order && order.status) {
    const pt = statusMappingENtoPT[order.status] || order.status;
    return { ...order, status: pt };
  }
  return order;
};

export const orderService = {
  async getOrders(params) {
    try {
      const queryString = params ? `?${params.toString()}` : '';
      const response = await api.get(`/api/orders${queryString}`);
      const ordersArray = Array.isArray(response.data) ? response.data : [];
      return ordersArray.map(translateOrderStatus);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      return [];
    }
  },

  async getOrderById(orderId) {
    try {
      const response = await api.get(`/api/orders/${orderId}`);
      return translateOrderStatus(response.data);
    } catch (error) {
      console.error(`Erro ao buscar pedido ${orderId}:`, error);
      throw error;
    }
  },

  async updateOrderStatus(orderId, newStatus, delivery_id = null) {
    try {
      // ✅ aceita PT, EN ou alias; sempre envia interno válido
      const statusForBackend = normalizeToInternalStatus(newStatus);

      const payload = {
        new_status: statusForBackend,
        // delivery_id é ignorado pelo backend neste endpoint, mas mantive se você usa em outro fluxo
        delivery_id: delivery_id ?? undefined,
      };

      const response = await api.put(`/api/orders/${orderId}/status`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      return translateOrderStatus(response.data);
    } catch (error) {
      console.error(`Erro ao atualizar status: ${orderId}`, error);
      throw error;
    }
  },

  async createOrder(orderData) {
    try {
      const response = await api.post('/api/orders', orderData);
      return translateOrderStatus(response.data);
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  },

  async cancelOrder(orderId, reason) {
    try {
      const payload = { new_status: 'cancelled', cancellation_reason: reason };
      const response = await api.put(`/api/orders/${orderId}/status`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      return translateOrderStatus(response.data);
    } catch (error) {
      console.error(`Erro ao cancelar pedido ${orderId}:`, error);
      throw error;
    }
  },

  async getOrderStats() {
    try {
      const response = await api.get('/api/orders/stats');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  },

  async updateDeliveryTime(orderId, estimatedTime) {
    try {
      const payload = { estimated_delivery_time: estimatedTime };
      const response = await api.put(`/api/orders/${orderId}/delivery-time`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      return translateOrderStatus(response.data);
    } catch (error) {
      console.error('Erro ao atualizar tempo de entrega:', error);
      throw error;
    }
  },

  async getOrdersPendingReview(restaurantId, signal) {
    try {
      console.log('🔍 Buscando pedidos para restaurante avaliar...');
      const response = await api.get('/api/orders/pending-client-review', { signal });
      const orders = Array.isArray(response.data) ? response.data : response;
      console.log(`✅ ${orders.length} pedidos pendentes encontrados`);
      return orders.map(translateOrderStatus);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('❌ Erro ao buscar pedidos pendentes:', error);
      }
      throw error;
    }
  },
};

export default orderService;
