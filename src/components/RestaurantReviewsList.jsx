import React, { useEffect, useState } from "react";
import { getRestaurantReviews } from "../services/restaurantReviewsService";

export default function RestaurantReviewsList({ restaurantId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getRestaurantReviews(restaurantId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [restaurantId]);

  if (loading) return <div>Carregando avaliações...</div>;
  if (!data) return <div>Erro ao carregar avaliações.</div>;

  return (
    <div>
      <h2>Avaliações ({data.total_reviews})</h2>
      <p>Média: {data.average_rating?.toFixed(2)}</p>
      <ul>
        {data.reviews.map((rev, i) => (
          <li key={i}>
            <strong>Nota:</strong> {rev.rating} <br />
            <strong>Comentário:</strong> {rev.comment} <br />
            <small>{new Date(rev.created_at).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
