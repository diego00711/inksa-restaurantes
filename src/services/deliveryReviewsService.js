// src/services/deliveryReviewsService.js

import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

export async function postDeliveryReview({ deliverymanId, orderId, rating, comment }) {
  const url = `${RESTAURANT_API_URL}/api/review/delivery/${encodeURIComponent(deliverymanId)}/reviews`;
  try {
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
      }),
    });
    return processResponse(response);
  } catch (error) {
    console.error('Erro ao enviar avaliação do entregador:', error);
    throw error;
  }
}
