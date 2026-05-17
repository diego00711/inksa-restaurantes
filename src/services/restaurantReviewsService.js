// src/services/restaurantReviewsService.js

import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';
import { apiFetch } from './apiClient';

export async function getRestaurantReviews(restaurantId) {
  const url = `${RESTAURANT_API_URL}/api/review/restaurants/${encodeURIComponent(restaurantId)}/reviews`;
  try {
    const response = await apiFetch(url, {
      method: 'GET',
      headers: createAuthHeaders(),
    });
    return processResponse(response);
  } catch (error) {
    console.error('Erro ao buscar avaliações do restaurante:', error);
    throw error;
  }
}

export async function postRestaurantReview({ restaurantId, orderId, rating, comment, categoryRatings, badges }) {
  const url = `${RESTAURANT_API_URL}/api/review/restaurants/${encodeURIComponent(restaurantId)}/reviews`;
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
        category_ratings: categoryRatings,
        badges,
      }),
    });
    return processResponse(response);
  } catch (error) {
    console.error('Erro ao enviar avaliação do restaurante:', error);
    throw error;
  }
}
