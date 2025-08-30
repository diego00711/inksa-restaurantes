import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

// Busca avaliações do entregador
export async function getDeliveryReviews(deliverymanId) {
  const response = await fetch(
    `${RESTAURANT_API_URL}/api/review/deliverymen/${encodeURIComponent(deliverymanId)}/reviews`,
    {
      headers: createAuthHeaders(),
    }
  );
  return processResponse(response);
}

// Envia uma avaliação para o entregador
export async function postDeliveryReview({ deliverymanId, orderId, rating, comment }) {
  const response = await fetch(
    `${RESTAURANT_API_URL}/api/review/deliverymen/${encodeURIComponent(deliverymanId)}/reviews`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...createAuthHeaders(),
      },
      body: JSON.stringify({ order_id: orderId, rating, comment }),
    }
  );
  return processResponse(response);
}
