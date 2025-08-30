import React, { useState } from "react";
import { postDeliveryReview } from "../services/deliveryReviewsService";

export default function DeliveryReviewForm({ deliverymanId, orderId, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await postDeliveryReview({
        deliverymanId,
        orderId,
        rating,
        comment,
      });
      setComment("");
      setRating(5);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao enviar avaliação");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Nota:
        <select value={rating} onChange={e => setRating(Number(e.target.value))}>
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <br />
      <label>
        Comentário:
        <textarea value={comment} onChange={e => setComment(e.target.value)} />
      </label>
      <br />
      <button type="submit" disabled={loading}>Enviar Avaliação</button>
      {error && <div style={{color: "red"}}>{error}</div>}
    </form>
  );
}
