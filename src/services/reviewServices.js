// src/services/reviewServices.js
// =================================================================
// ARQUIVO CENTRAL DE SERVIÇOS DE AVALIAÇÃO (VERSÃO CORRIGIDA)
// =================================================================

console.log('🚀 Módulo central de serviços de avaliação (reviewServices.js) está sendo carregado.');

// --- 1. IMPORTAÇÕES DAS APIs REAIS ---
// CORREÇÃO: Importando apenas as funções que realmente existem nos arquivos de serviço.

// Este serviço tem tanto a função de buscar (GET) quanto de postar (POST).
import { getRestaurantReviews, postRestaurantReview } from './restaurantReviewsService.js';

// Este serviço SÓ tem a função de postar (POST), usada no formulário.
import { postClientReview } from './clientReviewsService.js';

// Este serviço SÓ tem a função de postar (POST), usada no formulário.
import { postDeliveryReview } from './deliveryReviewsService.js';


// --- 2. EXPORTAÇÃO DOS SERVIÇOS ORGANIZADOS ---

/**
 * Serviço para gerenciar as avaliações do RESTAURANTE.
 */
export const restaurantReviewService = {
  getRestaurantReviews: getRestaurantReviews,
  createReview: postRestaurantReview,
};

/**
 * Serviço para gerenciar as avaliações dos CLIENTES.
 */
export const clientReviewService = {
  // A função getClientReviews não existe, então não a incluímos.
  createReview: postClientReview,
};

/**
 * Serviço para gerenciar as avaliações dos ENTREGADORES.
 */
export const deliveryReviewService = {
  // A função getDeliveryReviews não existe, então não a incluímos.
  createReview: postDeliveryReview,
};


// --- 3. FUNÇÕES UTILITÁRIAS ---
// (Esta parte continua a mesma)

export const reviewUtils = {
  formatReviewDate(dateString) {
    if (!dateString) return 'Data indisponível';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      console.error("Erro ao formatar data:", dateString, error);
      return 'Data inválida';
    }
  },
  
  validateReviewData(rating, orderId) {
    const errors = [];
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      errors.push('A nota da avaliação deve ser um número entre 1 e 5.');
    }
    if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
      errors.push('A referência do pedido é obrigatória para a avaliação.');
    }
    return errors;
  }
};

console.log('✅ Módulo central de serviços de avaliação (reviewServices.js) CORRIGIDO e pronto.');
