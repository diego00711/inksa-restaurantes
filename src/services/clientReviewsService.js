import axios from "axios";
import { RESTAURANT_API_URL } from "./api";

export async function postClientReview({
  clientId,
  orderId,
  rating,
  comment,
  token,
}) {
  const res = await axios.post(
    `${RESTAURANT_API_URL}/api/review/clients/${clientId}/reviews`,
    { order_id: orderId, rating, comment },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function getClientReviews(clientId) {
  const res = await axios.get(`${RESTAURANT_API_URL}/api/review/clients/${clientId}/reviews`);
  return res.data; // {reviews, average_rating, total_reviews}
}
