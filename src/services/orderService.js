// src/services/orderService.js

import api from './api';

// Mapeamento de status PT → EN (para enviar ao backend)
const statusMapping = {
  'Pendente': 'pending',
  'Aceito': 'accepted',
  'Preparando': 'preparing',
  'Pronto': 'ready',
  'Saiu para Entrega': 'out_for_delivery',
  'Entregue': 'delivered',
  'Cancelado': 'cancelled'
};

// Mapeamento inverso EN → PT (para exibir no frontend)
const statusMappingReverse = {
  'pending': 'Pendente',
  'accepted': 'Aceito',
  'preparing': 'Preparando',
  'ready': 'Pronto',
  'out_for_delivery': 'Saiu para Entrega',
  'delivered': 'Entregue',
  'cancelled': 'Cancelado'
};

/**
 * Função auxiliar para traduzir o status de um pedido de EN para PT.
 * @param {object} order - O objeto do pedido.
 * @returns {object} - O pedido com o status traduzido.
 */
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
  /**
   * Busca todos os pedidos.
   * Garante que sempre retornará um array.
   */
  async getOrders(params) {
    try {
      const queryString = params ? `?${params.toString()}` : '';
      const response = await api.get(`/api/orders${queryString}`);
      
      // Lógica robusta para extrair o array de pedidos
      const responseData = response.data;
      const ordersArray = Array.isArray(responseData)
        ? responseData
        : (responseData && Array.isArray(responseData.data) ? responseData.data : []);

      // Mapeia e traduz o status de cada pedido
      return ordersArray.map(translateOrderStatus);

    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      // Em caso de erro, retorna um array vazio para não quebrar a tela.
      return [];
    }
  },

  /**
   * Busca um pedido por ID.
   */
  async getOrderById(orderId) {
    try {
      const response = await api.get(`/api/orders/${orderId}`);
      // Traduz o status antes de retornar
      return translateOrderStatus(response.data);
    } catch (error) {
      console.error(`Erro ao buscar pedido ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Atualiza o status de um pedido.
   */
  async updateOrderStatus(orderId, newStatus, delivery_id = null) {
    try {
      const statusForBackend = statusMapping[newStatus];
      if (!statusForBackend) {
        throw new Error(`Status inválido: ${newStatus}`);
      }
      
      const payload = { status: statusForBackend, delivery_id };
      const response = await api.put(`/api/orders/${orderId}/status`, payload);
      
      return translateOrderStatus(response.data);
    } catch (error) {
      console.error(`Erro ao atualizar status do pedido ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Cria um novo pedido.
   */
  async createOrder(orderData) {
    try {
      const response = await api.post('/api/orders', orderData);
      return translateOrderStatus(response.data);
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  },

  /**
   * Cancela um pedido.
   */
  async cancelOrder(orderId, reason) {
    try {
      const payload = { status: 'cancelled', cancellation_reason: reason };
      const response = await api.put(`/api/orders/${orderId}/status`, payload);
      return translateOrderStatus(response.data);
    } catch (error) {
      console.error(`Erro ao cancelar pedido ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Busca estatísticas de pedidos.
   */
  async getOrderStats() {
    try {
      const response = await api.get('/api/orders/stats');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  },

  /**
   * Atualiza o tempo estimado de entrega.
   */
  async updateDeliveryTime(orderId, estimatedTime) {
    try {
      const payload = { estimated_delivery_time: estimatedTime };
      const response = await api.put(`/api/orders/${orderId}/delivery-time`, payload);
      return translateOrderStatus(response.data);
    } catch (error) {
      console.error(`Erro ao atualizar tempo de entrega do pedido ${orderId}:`, error);
      throw error;
    }
  }
};

export default orderService;
