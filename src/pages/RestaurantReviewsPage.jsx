import React from "react";
import RestaurantReviewsList from "../components/RestaurantReviewsList";
import { useProfile } from "../context/ProfileContext";

export default function RestaurantReviewsPage() {
  const { profile, loading } = useProfile();
 console.log("Profile carregado:", profile);

  if (loading) return <div>Carregando perfil...</div>;
  if (!profile) return <div>Perfil não encontrado.</div>;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Avaliações Recebidas</h1>
     <RestaurantReviewsList restaurantId={profile.id} />
    </div>
  );
}
