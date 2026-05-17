// src/services/clientReviewsService.js

import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';
import { apiFetch } from './apiClient';

export async function postClientReview({ clientId, orderId, rating, comment, badges }) {
  const url = `${RESTAURANT_API_URL}/api/review/clients/${encodeURIComponent(clientId)}/reviews`;
  try {
    const response = await apiFetch(url, {
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
  } catch (error) {
    console.error('Erro ao enviar avaliação do cliente:', error);
    throw error;
  }
}
