// src/services/restaurantReviewApi.js

// Funções auxiliares que você já deve ter em um arquivo como 'src/services/api.js'
import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

/**
 * Busca todas as avaliações de um restaurante específico.
 * @param {string} restaurantId - O UUID do restaurante.
 * @returns {Promise<object>} Os dados das avaliações (reviews, average_rating, total_reviews).
 */
export async function getRestaurantReviews(restaurantId) {
  // URL CORRIGIDA: Aponta para a rota exata do backend Flask.
  const url = `${RESTAURANT_API_URL}/restaurants/${encodeURIComponent(restaurantId)}/reviews`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: createAuthHeaders(),
  });
  
  return processResponse(response);
}

/**
 * Envia uma nova avaliação para um restaurante.
 * @param {object} reviewData - Contém restaurantId, orderId, rating, e comment.
 * @returns {Promise<object>} A resposta da API.
 */
export async function postRestaurantReview({ restaurantId, orderId, rating, comment }) {
  // URL CORRIGIDA: Aponta para a rota exata do backend Flask.
  const url = `${RESTAURANT_API_URL}/restaurants/${encodeURIComponent(restaurantId)}/reviews`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...createAuthHeaders(),
    },
    body: JSON.stringify({ 
      order_id: orderId, 
      rating, 
      comment 
    }),
  });

  return processResponse(response);
}
