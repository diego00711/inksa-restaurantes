// src/services/reviewServices.js
// =================================================================
// ARQUIVO CENTRAL DE SERVIÇOS DE AVALIAÇÃO
// Seus componentes React devem importar apenas deste arquivo.
// Ele organiza e distribui as funções de API para o resto da aplicação.
// =================================================================

console.log('🚀 Módulo central de serviços de avaliação (reviewServices.js) está sendo carregado.');

// --- 1. IMPORTAÇÕES DAS APIs REAIS ---
// Importa as funções de comunicação com o backend dos seus arquivos de serviço específicos.
// Adapte os nomes dos arquivos se forem diferentes.
import { getRestaurantReviews, postRestaurantReview } from './restaurantReviewsService.js';
import { getClientReviews, postClientReview } from './clientReviewsService.js';
import { getDeliveryReviews, postDeliveryReview } from './deliveryReviewsService.js';
// Se tiver um para itens de menu, adicione aqui também.
// import { getMenuItemReviews, postMenuItemReview } from './menuItemReviewsService.js';


// --- 2. EXPORTAÇÃO DOS SERVIÇOS ORGANIZADOS ---
// Agrupa as funções importadas em objetos de serviço consistentes.
// É isso que seus componentes React irão consumir.

/**
 * Serviço para gerenciar as avaliações do RESTAURANTE.
 */
export const restaurantReviewService = {
  getRestaurantReviews: getRestaurantReviews,
  createReview: postRestaurantReview, // Usamos 'createReview' como um nome padrão para postagens
};

/**
 * Serviço para gerenciar as avaliações dos CLIENTES.
 */
export const clientReviewService = {
  getClientReviews: getClientReviews,
  createReview: postClientReview,
};

/**
 * Serviço para gerenciar as avaliações dos ENTREGADORES.
 */
export const deliveryReviewService = {
  getDeliveryReviews: getDeliveryReviews,
  createReview: postDeliveryReview,
};

/*
// Exemplo se você adicionar avaliações de item de menu
export const menuItemReviewService = {
  getMenuItemReviews: getMenuItemReviews,
  createReview: postMenuItemReview,
};
*/


// --- 3. FUNÇÕES UTILITÁRIAS ---
// Funções auxiliares que podem ser usadas em qualquer lugar que lide com avaliações.

export const reviewUtils = {
  /**
   * Formata uma string de data (preferencialmente ISO) para o padrão brasileiro (dd/mm/aaaa).
   * @param {string} dateString - A data em formato de string.
   * @returns {string} A data formatada ou uma mensagem de erro amigável.
   */
  formatReviewDate(dateString) {
    if (!dateString) return 'Data indisponível';
    
    try {
      const date = new Date(dateString);
      // Verifica se a data é válida
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
  
  /**
   * Valida os dados de uma nova avaliação antes de enviar para a API.
   * @param {number} rating - A nota da avaliação (1 a 5).
   * @param {string} orderId - O ID do pedido associado.
   * @returns {string[]} Um array de mensagens de erro. Retorna um array vazio se os dados forem válidos.
   */
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

console.log('✅ Módulo central de serviços de avaliação (reviewServices.js) carregado e pronto.');
