// services/reviewServices.js - VERSÃO RESTAURANTES
import axios from 'axios';
import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Configuração do axios para incluir token automaticamente
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token nas requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==========================================
// SERVIÇO PARA VER AVALIAÇÕES DO RESTAURANTE
// ==========================================

export const restaurantReviewService = {
  // Listar avaliações que o restaurante recebeu
  async getRestaurantReviews(restaurantId) {
    try {
      const response = await api.get(`/restaurants/${restaurantId}/reviews`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao carregar avaliações do restaurante');
    }
  },
};

// ==========================================
// SERVIÇO PARA AVALIAR CLIENTES
// ==========================================

export const clientReviewService = {
  // Criar avaliação de cliente (Restaurante avalia cliente)
  async createReview(clientId, reviewData) {
    try {
      const response = await api.post(`/clients/${clientId}/reviews`, reviewData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao enviar avaliação do cliente');
    }
  },

  // Listar avaliações de um cliente (opcional - para ver histórico)
  async getClientReviews(clientId) {
    try {
      const response = await api.get(`/clients/${clientId}/reviews`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao carregar avaliações do cliente');
    }
  },
};

// ==========================================
// SERVIÇO PARA AVALIAR ENTREGADORES
// ==========================================

export const deliveryReviewService = {
  // Criar avaliação de entregador (Restaurante avalia entregador)
  async createReview(deliveryId, reviewData) {
    try {
      const response = await api.post(`/delivery/${deliveryId}/reviews`, reviewData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao enviar avaliação do entregador');
    }
  },

  // Listar avaliações de um entregador (opcional - para ver histórico)
  async getDeliveryReviews(deliveryId) {
    try {
      const response = await api.get(`/delivery/${deliveryId}/reviews`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro ao carregar avaliações do entregador');
    }
  },
};

// ==========================================
// UTILITÁRIOS PARA AVALIAÇÕES
// ==========================================

export const reviewUtils = {
  // Função para preparar dados de avaliação
  prepareReviewData(rating, comment, orderId, tags = [], categories = {}) {
    const reviewData = {
      rating: Number(rating),
      comment: comment.trim(),
      order_id: orderId,
    };

    // Se houver tags ou categorias, inclui no comentário
    if (tags.length > 0 || Object.keys(categories).length > 0) {
      const metadata = {
        tags,
        categories,
        originalComment: comment.trim(),
      };
      
      if (comment.trim()) {
        reviewData.comment = `${comment.trim()} [METADATA:${JSON.stringify(metadata)}]`;
      } else {
        reviewData.comment = `[METADATA:${JSON.stringify(metadata)}]`;
      }
    }

    return reviewData;
  },

  // Função para extrair metadata do comentário
  parseReviewComment(comment) {
    if (!comment) return { comment: '', tags: [], categories: {} };

    const metadataMatch = comment.match(/\[METADATA:({.*})\]$/);
    if (metadataMatch) {
      try {
        const metadata = JSON.parse(metadataMatch[1]);
        const cleanComment = comment.replace(/\s*\[METADATA:.*\]$/, '');
        return {
          comment: cleanComment,
          tags: metadata.tags || [],
          categories: metadata.categories || {},
        };
      } catch (error) {
        console.warn('Erro ao parsear metadata do comentário:', error);
      }
    }

    return { comment, tags: [], categories: {} };
  },

  // Validação de dados antes de enviar
  validateReviewData(rating, orderId) {
    const errors = [];

    if (!rating || rating < 1 || rating > 5) {
      errors.push('A avaliação deve ser entre 1 e 5 estrelas');
    }

    if (!orderId) {
      errors.push('ID do pedido é obrigatório');
    }

    return errors;
  },

  // Formatar data das avaliações
  formatReviewDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Data inválida';
    }
  },

  // Calcular distribuição de notas
  calculateRatingDistribution(reviews) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    reviews.forEach(review => {
      const rating = Math.round(review.rating);
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++;
      }
    });

    return distribution;
  },

  // Classificar sentimento da avaliação
  getReviewSentiment(rating) {
    if (rating >= 4) return 'positive';
    if (rating >= 3) return 'neutral';
    return 'negative';
  },
};

// ==========================================
// HOOK PARA CARREGAR AVALIAÇÕES
// ==========================================

export const useRestaurantReviews = (restaurantId) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  const loadReviews = async () => {
    if (!restaurantId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await restaurantReviewService.getRestaurantReviews(restaurantId);
      
      setReviews(data.reviews || []);
      setStats({
        averageRating: data.average_rating || 0,
        totalReviews: data.total_reviews || 0,
        distribution: reviewUtils.calculateRatingDistribution(data.reviews || [])
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [restaurantId]);

  return {
    reviews,
    stats,
    loading,
    error,
    refreshReviews: loadReviews,
  };
};

// Export default para compatibilidade
export default {
  restaurantReviewService,
  clientReviewService, 
  deliveryReviewService,
  reviewUtils,
  useRestaurantReviews,
};
