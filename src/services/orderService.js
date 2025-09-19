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

export const orderService = {
  // Buscar todos os pedidos
  async getOrders(params) {
    try {
      const queryString = params ? `?${params.toString()}` : '';
      const response = await api.get(`/api/orders${queryString}`);
      
      // Converter status de EN para PT na resposta
      if (response.data && Array.isArray(response.data)) {
        return response.data.map(order => ({
          ...order,
          status: statusMappingReverse[order.status] || order.status
        }));
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      throw error;
    }
  },

  // Buscar pedido por ID
  async getOrderById(orderId) {
    try {
      const response = await api.get(`/api/orders/${orderId}`);
      
      // Converter status de EN para PT
      if (response.data && response.data.status) {
        response.data.status = statusMappingReverse[response.data.status] || response.data.status;
      }
      
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      throw error;
    }
  },

  // Atualizar status do pedido
  async updateOrderStatus(orderId, newStatus, delivery_id = null) {
    try {
      console.log('=== updateOrderStatus ===');
      console.log('Recebido - orderId:', orderId);
      console.log('Recebido - newStatus (PT):', newStatus);
      
      // IMPORTANTE: Converter status de PT para EN antes de enviar
      const statusForBackend = statusMapping[newStatus];
      
      if (!statusForBackend) {
        console.error(`Status não mapeado: "${newStatus}"`);
        throw new Error(`Status inválido: ${newStatus}`);
      }
      
      console.log('Enviando para backend - status (EN):', statusForBackend);
      
      const payload = {
        status: statusForBackend,
        delivery_id: delivery_id
      };
      
      console.log('Payload completo:', payload);
      
      const response = await api.put(`/api/orders/${orderId}/status`, payload);
      
      // Converter status de EN para PT na resposta
      if (response.data && response.data.status) {
        response.data.status = statusMappingReverse[response.data.status] || response.data.status;
      }
      
      console.log('Resposta do backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      
      if (error.response) {
        console.error('Detalhes do erro:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      throw error;
    }
  },

  // Criar novo pedido
  async createOrder(orderData) {
    try {
      const response = await api.post('/api/orders', orderData);
      
      // Converter status de EN para PT na resposta
      if (response.data && response.data.status) {
        response.data.status = statusMappingReverse[response.data.status] || response.data.status;
      }
      
      return response.data;
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  },

  // Cancelar pedido
  async cancelOrder(orderId, reason) {
    try {
      // Usar o status em inglês
      const response = await api.put(`/api/orders/${orderId}/status`, {
        status: 'cancelled',
        cancellation_reason: reason
      });
      
      // Converter status de EN para PT na resposta
      if (response.data && response.data.status) {
        response.data.status = statusMappingReverse[response.data.status] || response.data.status;
      }
      
      return response.data;
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      throw error;
    }
  },

  // Buscar estatísticas de pedidos
  async getOrderStats() {
    try {
      const response = await api.get('/api/orders/stats');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  },

  // Atualizar tempo estimado de entrega
  async updateDeliveryTime(orderId, estimatedTime) {
    try {
      const response = await api.put(`/api/orders/${orderId}/delivery-time`, {
        estimated_delivery_time: estimatedTime
      });
      
      // Converter status de EN para PT na resposta
      if (response.data && response.data.status) {
        response.data.status = statusMappingReverse[response.data.status] || response.data.status;
      }
      
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar tempo de entrega:', error);
      throw error;
    }
  }
};

// Export default para compatibilidade
export default orderService;
