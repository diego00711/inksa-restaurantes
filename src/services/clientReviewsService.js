import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

// Busca avaliações do cliente
export async function getClientReviews(clientId) {
  const response = await fetch(
    `${RESTAURANT_API_URL}/api/review/clients/${encodeURIComponent(clientId)}/reviews`,
    {
      headers: createAuthHeaders(),
    }
  );
  return processResponse(response);
}

// Envia uma avaliação para o cliente
export async function postClientReview({ clientId, orderId, rating, comment }) {
  const response = await fetch(
    `${RESTAURANT_API_URL}/api/review/clients/${encodeURIComponent(clientId)}/reviews`,
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
