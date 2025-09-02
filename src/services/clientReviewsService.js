// src/services/clientReviewsService.js

import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

/**
 * Envia uma nova avaliação para um cliente.
 * @param {object} reviewData - Contém clientId, orderId, rating, etc.
 * @returns {Promise<object>} A resposta da API.
 */
export async function postClientReview({ clientId, orderId, rating, comment, badges }) {
  // URL CORRIGIDA: Aponta para /clients/... como no backend.
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
      comment,
      badges, // Campo extra
    }),
  });

  return processResponse(response);
}
