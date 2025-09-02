// src/services/restaurantReviewsService.js

// Supondo que você tenha um arquivo 'api.js' com estas funções auxiliares
import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

/**
 * Busca todas as avaliações de um restaurante específico.
 * @param {string} restaurantId - O UUID do restaurante.
 * @returns {Promise<object>} Os dados das avaliações.
 */
export async function getRestaurantReviews(restaurantId) {
  // URL CORRIGIDA: Aponta para a rota exata do backend Flask.
  const url = `${RESTAURANT_API_URL}/restaurants/${encodeURIComponent(restaurantId)}/reviews`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: createAuthHeaders(), // Envia o token de autenticação
  });
  
  return processResponse(response); // Processa a resposta (trata erros, converte para JSON)
}

/**
 * Envia uma nova avaliação para um restaurante.
 * @param {object} reviewData - Contém restaurantId, orderId, rating, etc.
 * @returns {Promise<object>} A resposta da API.
 */
export async function postRestaurantReview({ restaurantId, orderId, rating, comment, categoryRatings, badges }) {
  // URL CORRIGIDA: Aponta para a rota exata do backend Flask.
  const url = `${RESTAURANT_API_URL}/restaurants/${encodeURIComponent(restaurantId)}/reviews`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...createAuthHeaders(), // Envia o token de autenticação
    },
    // O backend espera 'order_id', 'rating', e 'comment'.
    // Os outros campos (categoryRatings, badges) não estão no seu backend Flask atual,
    // mas podemos enviá-los para uso futuro.
    body: JSON.stringify({ 
      order_id: orderId, 
      rating, 
      comment,
      // Dados extras que o backend pode ou não usar:
      category_ratings: categoryRatings, 
      badges,
    }),
  });

  return processResponse(response);
}
