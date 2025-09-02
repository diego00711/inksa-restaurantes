// src/services/deliveryReviewsService.js

import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

export async function postDeliveryReview({ deliverymanId, orderId, rating, comment }) {
  // CORREÇÃO FINAL: Adicionado o prefixo /api/review/ e corrigido para 'delivery'
  const url = `${RESTAURANT_API_URL}/api/review/delivery/${encodeURIComponent(deliverymanId)}/reviews`;

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
