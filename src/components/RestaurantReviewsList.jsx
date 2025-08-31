import React, { useEffect, useState } from "react";
import { Star, MessageSquare, Calendar, TrendingUp, Award } from "lucide-react";
import { getRestaurantReviews } from "../services/restaurantReviewsService";

// Componente para renderizar estrelas
const StarRating = ({ rating, size = "w-5 h-5" }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300 fill-gray-300"
          }`}
        />
      ))}
    </div>
  );
};

// Componente para barra de progresso das avaliações
const RatingProgressBar = ({ rating, count, total }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 w-12">
        <span className="text-sm font-medium text-gray-600">{rating}</span>
        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
      </div>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <span className="text-sm text-gray-500 w-8">{count}</span>
    </div>
  );
};

export default function RestaurantReviewsList({ restaurantId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getRestaurantReviews(restaurantId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          Erro ao carregar avaliações
        </h3>
        <p className="text-gray-500">
          Tente recarregar a página ou entre em contato com o suporte
        </p>
      </div>
    );
  }

  // Simulando distribuição de notas (você pode adaptar conforme seus dados)
  const ratingDistribution = [
    { rating: 5, count: Math.floor(data.total_reviews * 0.6) },
    { rating: 4, count: Math.floor(data.total_reviews * 0.25) },
    { rating: 3, count: Math.floor(data.total_reviews * 0.1) },
    { rating: 2, count: Math.floor(data.total_reviews * 0.03) },
    { rating: 1, count: Math.floor(data.total_reviews * 0.02) },
  ];

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-700 text-sm font-medium mb-1">Média Geral</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-yellow-800">
                  {data.average_rating?.toFixed(1) || "0.0"}
                </span>
                <StarRating rating={Math.round(data.average_rating || 0)} size="w-4 h-4" />
              </div>
            </div>
            <Award className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium mb-1">Total de Avaliações</p>
              <span className="text-3xl font-bold text-blue-800">
                {data.total_reviews}
              </span>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium mb-1">Satisfação</p>
              <span className="text-3xl font-bold text-green-800">
                {data.average_rating ? Math.round((data.average_rating / 5) * 100) : 0}%
              </span>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Distribuição das Avaliações
        </h3>
        <div className="space-y-3">
          {ratingDistribution.map((item) => (
            <RatingProgressBar
              key={item.rating}
              rating={item.rating}
              count={item.count}
              total={data.total_reviews}
            />
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {data.reviews && data.reviews.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Avaliações Recentes
          </h3>
          <div className="space-y-4">
            {data.reviews.map((review, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold">
                      {review.client_name?.charAt(0) || "C"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {review.client_name || "Cliente"}
                      </p>
                      <StarRating rating={review.rating} size="w-4 h-4" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {new Date(review.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>

                {review.comment && (
                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <p className="text-gray-700 leading-relaxed">
                      "{review.comment}"
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      review.rating >= 4 
                        ? "bg-green-100 text-green-700" 
                        : review.rating >= 3 
                        ? "bg-yellow-100 text-yellow-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      {review.rating >= 4 ? "Positiva" : review.rating >= 3 ? "Neutra" : "Negativa"}
                    </div>
                  </div>
                  
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
                    Responder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Nenhuma avaliação ainda
          </h3>
          <p className="text-gray-500">
            Quando os clientes avaliarem seu restaurante, as avaliações aparecerão aqui
          </p>
        </div>
      )}
    </div>
  );
}
