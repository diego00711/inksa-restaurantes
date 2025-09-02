// src/services/clientReviewsService.js

import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

export async function postClientReview({ clientId, orderId, rating, comment, badges }) {
  // CORREÇÃO FINAL: Adicionado o prefixo /api/review/
  const url = `${RESTAURANT_API_URL}/api/review/clients/${encodeURIComponent(clientId)}/reviews`;

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
      badges,
    }),
  });

  return processResponse(response);
}
