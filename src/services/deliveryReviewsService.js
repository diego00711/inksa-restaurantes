// src/services/deliveryReviewsService.js

import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

/**
 * Envia uma nova avaliação para um entregador.
 * @param {object} reviewData - Contém deliverymanId, orderId, rating, e comment.
 * @returns {Promise<object>} A resposta da API.
 */
export async function postDeliveryReview({ deliverymanId, orderId, rating, comment }) {
  // URL CORRIGIDA: Aponta para /delivery/... como no backend.
  const url = `${RESTAURANT_API_URL}/delivery/${encodeURIComponent(deliverymanId)}/reviews`;

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
