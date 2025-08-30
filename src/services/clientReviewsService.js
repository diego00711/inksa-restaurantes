import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api/review";

export async function postClientReview({
  clientId,
  orderId,
  rating,
  comment,
  token,
}) {
  const res = await axios.post(
    `${API_BASE}/clients/${clientId}/reviews`,
    { order_id: orderId, rating, comment },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function getClientReviews(clientId) {
  const res = await axios.get(`${API_BASE}/clients/${clientId}/reviews`);
  return res.data; // {reviews, average_rating, total_reviews}
}
