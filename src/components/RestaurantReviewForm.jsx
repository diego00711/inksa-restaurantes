import React, { useState } from "react";
import { Star, Send, AlertCircle, CheckCircle, MessageSquare, Utensils } from "lucide-react";
import { postRestaurantReview } from "../services/restaurantReviewsService";

// Componente para rating com estrelas interativas
const StarRating = ({ rating, onRatingChange, size = "w-8 h-8", interactive = false }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} transition-all duration-200 ${
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
        <span className="ml-2 text-sm font-medium text-gray-600">
          ({rating}/5)
        </span>
      )}
    </div>
  );
};

// Componente para avaliação por categorias
const CategoryRatings = ({ ratings, onRatingChange }) => {
  const categories = [
    { id: "food_quality", label: "Qualidade da comida", icon: "🍽️" },
    { id: "service", label: "Atendimento", icon: "👥" },
    { id: "delivery_time", label: "Tempo de entrega", icon: "⏱️" },
    { id: "packaging", label: "Embalagem", icon: "📦" },
  ];

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-800">Avalie por categoria:</h4>
      {categories.map((category) => (
        <div key={category.id} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{category.icon}</span>
            <span className="text-sm font-medium text-gray-700">
              {category.label}
            </span>
          </div>
          <StarRating
            rating={ratings[category.id] || 0}
            onRatingChange={(rating) => onRatingChange(category.id, rating)}
            size="w-5 h-5"
            interactive={true}
          />
        </div>
      ))}
    </div>
  );
};

// Componente para badges de avaliação rápida específicos para restaurantes
const RestaurantRatingBadges = ({ selectedBadges, onBadgeToggle }) => {
  const badges = [
    { id: "comida-saborosa", label: "Comida saborosa", emoji: "😋" },
    { id: "bem-embalado", label: "Bem embalado", emoji: "📦" },
    { id: "entrega-rapida", label: "Entrega rápida", emoji: "⚡" },
    { id: "porcao-generosa", label: "Porção generosa", emoji: "🍽️" },
    { id: "temperatura-ideal", label: "Temperatura ideal", emoji: "🔥" },
    { id: "atendimento-otimo", label: "Atendimento ótimo", emoji: "👏" },
    { id: "comida-fria", label: "Comida fria", emoji: "❄️" },
    { id: "atrasou", label: "Atrasou", emoji: "⏰" },
    { id: "mal-embalado", label: "Mal embalado", emoji: "⚠️" },
  ];

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-3">
        Tags da experiência (opcional):
      </p>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <button
            key={badge.id}
            type="button"
            onClick={() => onBadgeToggle(badge.id)}
            className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedBadges.includes(badge.id)
                ? "bg-red-100 text-red-700 border-2 border-red-300"
                : "bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200"
            }`}
          >
            <span className="mr-1">{badge.emoji}</span>
            {badge.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function RestaurantReviewForm({ restaurantId, orderId, token, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [categoryRatings, setCategoryRatings] = useState({});
  const [comment, setComment] = useState("");
  const [selectedBadges, setSelectedBadges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleBadgeToggle = (badgeId) => {
    setSelectedBadges(prev => 
      prev.includes(badgeId) 
        ? prev.filter(id => id !== badgeId)
        : [...prev, badgeId]
    );
  };

  const handleCategoryRatingChange = (categoryId, rating) => {
    setCategoryRatings(prev => ({
      ...prev,
      [categoryId]: rating
    }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await postRestaurantReview({
        restaurantId,
        orderId,
        rating,
        categoryRatings, // Você pode adicionar este campo ao seu serviço
        comment: comment.trim(),
        badges: selectedBadges,
        token,
      });
      
      setSuccess(true);
      
      // Limpar formulário após 1.5s
      setTimeout(() => {
        setComment("");
        setRating(5);
        setCategoryRatings({});
        setSelectedBadges([]);
        setSuccess(false);
        if (onSuccess) onSuccess();
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao enviar avaliação");
    } finally {
      setLoading(false);
    }
  }

  const getRatingText = (rating) => {
    const texts = {
      1: "Muito insatisfeito",
      2: "Insatisfeito", 
      3: "Regular",
      4: "Satisfeito",
      5: "Muito satisfeito"
    };
    return texts[rating] || "";
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600"; 
    return "text-red-600";
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-full">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-green-800 font-semibold">Avaliação enviada!</h3>
            <p className="text-green-700 text-sm">
              Obrigado pelo seu feedback. Isso ajuda a melhorar nossos serviços.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rating Section */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
        <label className="block text-lg font-semibold text-gray-800 mb-4">
          <Utensils className="inline h-5 w-5 mr-2" />
          Como foi sua experiência com este restaurante?
        </label>
        
        <div className="flex flex-col items-center space-y-4">
          <StarRating 
            rating={rating} 
            onRatingChange={setRating} 
            size="w-10 h-10"
            interactive={true}
          />
          
          <div className={`text-center ${getRatingColor(rating)}`}>
            <p className="text-xl font-semibold">
              {getRatingText(rating)}
            </p>
          </div>
        </div>
      </div>

      {/* Category Ratings */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
        <CategoryRatings
          ratings={categoryRatings}
          onRatingChange={handleCategoryRatingChange}
        />
      </div>

      {/* Quick Rating Badges */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <RestaurantRatingBadges 
          selectedBadges={selectedBadges}
          onBadgeToggle={handleBadgeToggle}
        />
      </div>

      {/* Comment Section */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          <MessageSquare className="inline h-4 w-4 mr-2" />
          Conte-nos mais sobre sua experiência:
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Descreva sua experiência com o restaurante, qualidade da comida, atendimento, tempo de entrega..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
          maxLength={500}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500">
            {comment.length}/500 caracteres
          </span>
          {comment.length > 450 && (
            <span className="text-xs text-red-500">
              Limite quase atingido
            </span>
          )}
        </div>
      </div>

      {/* Feedback Incentive */}
      <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
        <h4 className="text-yellow-800 font-semibold mb-2 text-sm">
          ⭐ Sua opinião é importante!
        </h4>
        <p className="text-yellow-700 text-xs">
          Seu feedback ajuda outros clientes a fazerem melhores escolhas e motiva os restaurantes a melhorarem seus serviços.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
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
            Publicar Avaliação
          </>
        )}
      </button>

      {/* Helper text */}
      <p className="text-xs text-gray-500 text-center">
        Ao enviar esta avaliação, você concorda que ela pode ser exibida publicamente
      </p>
    </form>
  );
}
