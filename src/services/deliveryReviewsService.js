// src/services/deliveryReviewsService.js

import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';
import { apiFetch } from './apiClient';

export async function postDeliveryReview({ deliverymanId, orderId, rating, comment }) {
  const url = `${RESTAURANT_API_URL}/api/review/delivery/${encodeURIComponent(deliverymanId)}/reviews`;
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
      }),
    });
    return processResponse(response);
  } catch (error) {
    console.error('Erro ao enviar avaliação do entregador:', error);
    throw error;
  }
}
