// src/services/reviewServices.js

// Importa as funções reais dos arquivos de serviço específicos
import { getRestaurantReviews, postRestaurantReview } from './restaurantReviewApi';
import { getClientReviews, postClientReview } from './clientReviewApi';
import { getDeliveryReviews, postDeliveryReview } from './deliveryReviewApi';

/**
 * Serviço para gerenciar avaliações de RESTAURANTES.
 * Conecta os componentes React com as chamadas de API reais.
 */
export const restaurantReviewService = {
  // Mapeia a função que busca dados da API
  getRestaurantReviews: getRestaurantReviews,
  // Mapeia a função que cria uma nova avaliação
  createReview: postRestaurantReview,
};

/**
 * Serviço para gerenciar avaliações de CLIENTES.
 * (Ainda não utilizado no frontend, mas pronto para uso futuro)
 */
export const clientReviewService = {
  getClientReviews: getClientReviews,
  createReview: postClientReview,
};

/**
 * Serviço para gerenciar avaliações de ENTREGADORES.
 * (Ainda não utilizado no frontend, mas pronto para uso futuro)
 */
export const deliveryReviewService = {
  getDeliveryReviews: getDeliveryReviews,
  createReview: postDeliveryReview,
};

/**
 * Funções utilitárias para formatação e validação de dados de avaliações.
 */
export const reviewUtils = {
  /**
   * Formata uma string de data (ISO) para o padrão brasileiro (dd/mm/aaaa).
   * @param {string} dateString - A data em formato de string.
   * @returns {string} A data formatada ou uma mensagem de erro.
   */
  formatReviewDate(dateString) {
    if (!dateString) return 'Data inválida';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      return 'Data inválida';
    }
  },
  
  /**
   * Valida os dados de uma nova avaliação.
   * @param {number} rating - A nota da avaliação.
   * @param {string} orderId - O ID do pedido associado.
   * @returns {string[]} Um array de mensagens de erro. Vazio se for válido.
   */
  validateReviewData(rating, orderId) {
    const errors = [];
    if (!rating || rating < 1 || rating > 5) {
      errors.push('A nota da avaliação deve ser um número entre 1 e 5.');
    }
    if (!orderId) {
      errors.push('A referência do pedido é obrigatória para a avaliação.');
    }
    return errors;
  }
};

console.log('✅ reviewServices.js (API REAL) carregado com sucesso!');
