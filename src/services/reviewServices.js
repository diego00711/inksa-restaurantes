// services/reviewServices.js - VERSÃO MÍNIMA PARA DEBUG

console.log('reviewServices.js carregado com sucesso!');

// Serviços mais básicos possíveis
export const restaurantReviewService = {
  async getRestaurantReviews(restaurantId) {
    console.log('getRestaurantReviews chamado para:', restaurantId);
    
    // Por enquanto retorna dados simulados
    return {
      reviews: [
        {
          rating: 5,
          comment: "Teste de avaliação",
          created_at: new Date().toISOString()
        }
      ],
      average_rating: 5.0,
      total_reviews: 1
    };
  }
};

export const clientReviewService = {
  async createReview(clientId, reviewData) {
    console.log('Tentando avaliar cliente:', clientId, reviewData);
    
    // Simula sucesso
    return { message: 'Avaliação simulada enviada!' };
  }
};

export const deliveryReviewService = {
  async createReview(deliveryId, reviewData) {
    console.log('Tentando avaliar entregador:', deliveryId, reviewData);
    
    // Simula sucesso
    return { message: 'Avaliação simulada enviada!' };
  }
};

export const reviewUtils = {
  formatReviewDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR');
  },
  
  validateReviewData(rating, orderId) {
    return []; // Sem validação por enquanto
  }
};

console.log('Todos os serviços exportados com sucesso!');
