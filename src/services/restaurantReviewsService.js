import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

/**
 * Busca avaliações do restaurante.
 * GET /api/review/restaurants/:restaurantId/reviews
 */
export async function getRestaurantReviews(restaurantId) {
  const response = await fetch(
    `${RESTAURANT_API_URL}/api/review/restaurants/${encodeURIComponent(restaurantId)}/reviews`,
    {
      headers: createAuthHeaders(),
    }
  );
  return processResponse(response);
}

/**
 * Envia uma avaliação para o restaurante.
 * POST /api/review/restaurants/:restaurantId/reviews
 */
export async function postRestaurantReview({ restaurantId, orderId, rating, comment, token }) {
  const response = await fetch(
    `${RESTAURANT_API_URL}/api/review/restaurants/${encodeURIComponent(restaurantId)}/reviews`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...createAuthHeaders(token),
      },
      body: JSON.stringify({ order_id: orderId, rating, comment }),
    }
  );
  return processResponse(response);
}
