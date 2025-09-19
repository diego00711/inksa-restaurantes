// src/services/orderService.js (VERSÃO COM CORREÇÃO DE CABEÇALHO)

import api from './api';

// Mapeamento de status PT -> EN (para enviar ao backend)
const statusMapping = {
  'Pendente': 'pending',
  'Aceito': 'accepted',
  'Preparando': 'preparing',
  'Pronto': 'ready',
  'Saiu para Entrega': 'delivering',
  'Entregue': 'delivered',
  'Cancelado': 'cancelled'
};

// Mapeamento inverso EN -> PT (para exibir no frontend)
const statusMappingReverse = {
  'pending': 'Pendente',
  'accepted': 'Aceito',
  'preparing': 'Preparando',
  'ready': 'Pronto',
  'delivering': 'Saiu para Entrega',
  'delivered': 'Entregue',
  'cancelled': 'Cancelado'
};

const translateOrderStatus = (order) => {
  if (order && order.status) {
    return {
      ...order,
      status: statusMappingReverse[order.status] || order.status,
    };
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
      const statusForBackend = statusMapping[newStatus];
      if (!statusForBackend) {
        throw new Error(`Status inválido para mapeamento: ${newStatus}`);
      }
      
      const payload = { 
        new_status: statusForBackend,
        delivery_id: delivery_id
      };
      
      // ✅ CORREÇÃO FINAL: Adicionando a configuração do cabeçalho explicitamente.
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      // Passa o payload e a configuração para o `api.put`.
      const response = await api.put(`/api/orders/${orderId}/status`, payload, config);
      
      return translateOrderStatus(response.data);
    } catch (error) {
      console.error(`Erro ao atualizar status do pedido ${orderId}:`, error);
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
      const payload = { 
        new_status: 'cancelled', 
        cancellation_reason: reason 
      };
      const config = { headers: { 'Content-Type': 'application/json' } };
      const response = await api.put(`/api/orders/${orderId}/status`, payload, config);
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
      const config = { headers: { 'Content-Type': 'application/json' } };
      const response = await api.put(`/api/orders/${orderId}/delivery-time`, payload, config);
      return translateOrderStatus(response.data);
    } catch (error) {
      console.error(`Erro ao atualizar tempo de entrega do pedido ${orderId}:`, error);
      throw error;
    }
  }
};

export default orderService;
