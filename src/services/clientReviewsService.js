// src/services/clientReviewApi.js

import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

/**
 * Busca todas as avaliações de um cliente específico.
 * @param {string} clientId - O UUID do cliente.
 * @returns {Promise<object>} Os dados das avaliações.
 */
export async function getClientReviews(clientId) {
  // URL CORRIGIDA: Aponta para /clients/...
  const url = `${RESTAURANT_API_URL}/clients/${encodeURIComponent(clientId)}/reviews`;

  const response = await fetch(url, {
    method: 'GET',
    headers: createAuthHeaders(),
  });

  return processResponse(response);
}

/**
 * Envia uma nova avaliação para um cliente.
 * @param {object} reviewData - Contém clientId, orderId, rating, e comment.
 * @returns {Promise<object>} A resposta da API.
 */
export async function postClientReview({ clientId, orderId, rating, comment }) {
  // URL CORRIGIDA: Aponta para /clients/...
  const url = `${RESTAURANT_API_URL}/clients/${encodeURIComponent(clientId)}/reviews`;

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
