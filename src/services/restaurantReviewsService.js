// src/services/restaurantReviewsService.js

import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

export async function getRestaurantReviews(restaurantId) {
  // CORREÇÃO FINAL: Adicionado o prefixo /api/review/
  const url = `${RESTAURANT_API_URL}/api/review/restaurants/${encodeURIComponent(restaurantId)}/reviews`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: createAuthHeaders(),
  });
  
  return processResponse(response);
}

export async function postRestaurantReview({ restaurantId, orderId, rating, comment, categoryRatings, badges }) {
  // CORREÇÃO FINAL: Adicionado o prefixo /api/review/
  const url = `${RESTAURANT_API_URL}/api/review/restaurants/${encodeURIComponent(restaurantId)}/reviews`;

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
      category_ratings: categoryRatings, 
      badges,
    }),
  });

  return processResponse(response);
}
