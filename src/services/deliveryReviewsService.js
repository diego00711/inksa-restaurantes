// src/services/deliveryReviewApi.js

import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

/**
 * Busca todas as avaliações de um entregador específico.
 * @param {string} deliveryId - O UUID do entregador.
 * @returns {Promise<object>} Os dados das avaliações.
 */
export async function getDeliveryReviews(deliveryId) {
  // URL CORRIGIDA: Aponta para /delivery/... como no backend.
  const url = `${RESTAURANT_API_URL}/delivery/${encodeURIComponent(deliveryId)}/reviews`;

  const response = await fetch(url, {
    method: 'GET',
    headers: createAuthHeaders(),
  });

  return processResponse(response);
}

/**
 * Envia uma nova avaliação para um entregador.
 * @param {object} reviewData - Contém deliveryId, orderId, rating, e comment.
 * @returns {Promise<object>} A resposta da API.
 */
export async function postDeliveryReview({ deliveryId, orderId, rating, comment }) {
  // URL CORRIGIDA: Aponta para /delivery/... como no backend.
  const url = `${RESTAURANT_API_URL}/delivery/${encodeURIComponent(deliveryId)}/reviews`;

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
