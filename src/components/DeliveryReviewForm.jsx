import React, { useState } from "react";
import { Star, Send, AlertCircle, CheckCircle } from "lucide-react";
import { postDeliveryReview } from "../services/deliveryReviewsService";

const StarRating = ({ rating, onRatingChange, interactive = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-8 h-8 transition-all duration-200 ${
            interactive ? "cursor-pointer hover:scale-110" : ""
          } ${
            star <= (hoverRating || rating)
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300 hover:text-yellow-300"
          }`}
          onClick={() => interactive && onRatingChange && onRatingChange(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
        />
      ))}
      {rating > 0 && (
        <span className="ml-2 text-sm font-medium text-gray-600">({rating}/5)</span>
      )}
    </div>
  );
};

const getRatingText = (r) => {
  const map = { 1: "Muito insatisfeito", 2: "Insatisfeito", 3: "Regular", 4: "Satisfeito", 5: "Muito satisfeito" };
  return map[r] || "";
};

const getRatingColor = (r) => {
  if (r >= 4) return "text-green-600";
  if (r >= 3) return "text-yellow-600";
  return "text-red-600";
};

export default function DeliveryReviewForm({ deliverymanId, orderId, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await postDeliveryReview({ deliverymanId, orderId, rating, comment: comment.trim() });
      setSuccess(true);
      setTimeout(() => {
        setComment("");
        setRating(5);
        setSuccess(false);
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Erro ao enviar avaliação");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-full">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-green-800 font-semibold">Avaliação enviada!</h3>
            <p className="text-green-700 text-sm">Obrigado pelo seu feedback sobre o entregador.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rating Section */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
        <label className="block text-lg font-semibold text-gray-800 mb-4">
          Como foi a entrega?
        </label>
        <div className="flex flex-col items-center space-y-4">
          <StarRating rating={rating} onRatingChange={setRating} interactive />
          <div className={`text-center ${getRatingColor(rating)}`}>
            <p className="text-xl font-semibold">{getRatingText(rating)}</p>
          </div>
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Comentário (opcional):
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Descreva sua experiência com o entregador..."
          rows={3}
          maxLength={500}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">{comment.length}/500 caracteres</span>
          {comment.length > 450 && (
            <span className="text-xs text-orange-500">Limite quase atingido</span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
        }`}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Enviando...
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            Enviar Avaliação
          </>
        )}
      </button>
    </form>
  );
}
