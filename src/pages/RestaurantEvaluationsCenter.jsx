import React, { useState } from "react";
import RestaurantReviewsList from "../components/RestaurantReviewsList";
import ClientReviewForm from "../components/ClientReviewForm";
import DeliveryReviewForm from "../components/DeliveryReviewForm";
import { useProfile } from "../context/ProfileContext";
import useDeliveredOrders from "../hooks/useDeliveredOrders";

export default function RestaurantEvaluationsCenter() {
  const { profile, loading } = useProfile();
  const { orders, loading: loadingOrders } = useDeliveredOrders(profile?.id);
  const [highlightOrderId, setHighlightOrderId] = useState(null);

  if (loading) return <div>Carregando perfil...</div>;
  if (!profile) return <div>Perfil não encontrado.</div>;

  return (
    <div style={{padding: 24, background: "#fff8f0"}}>
      <h1 className="text-2xl font-bold mb-4">Central de Avaliações & Feedback</h1>
      <section style={{background:"#fff4e1",padding:16,borderRadius:8,marginBottom:32}}>
        <h2 className="text-xl font-bold mb-2">Como seu restaurante está sendo avaliado?</h2>
        <RestaurantReviewsList restaurantId={profile.id} />
      </section>

      <section style={{background:"#f6ffe1",padding:16,borderRadius:8}}>
        <h2 className="text-xl font-bold mb-2">Avalie seus clientes e entregadores</h2>
        <p style={{marginBottom:16}}>Valorize a experiência avaliando quem faz parte do seu negócio.</p>
        {loadingOrders ? (
          <div>Carregando lista de pedidos entregues...</div>
        ) : (
          <ul style={{listStyle:"none",padding:0}}>
            {orders.map((order) => (
              <li key={order.id} style={{
                border:"1px solid #eee", margin:"1em 0", padding:16, borderRadius:8, background: highlightOrderId===order.id ? '#e6f7ff' : '#fff'
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <strong>Pedido #{order.id}</strong> <br />
                    <small>Data: {new Date(order.completed_at).toLocaleDateString()}</small>
                  </div>
                  <button
                    style={{background:"#ffb300",color:"#fff",padding:"6px 12px",border:"none",borderRadius:4,cursor:"pointer"}}
                    onClick={()=>setHighlightOrderId(order.id)}
                  >
                    Avaliar agora
                  </button>
                </div>
                {highlightOrderId===order.id && (
                  <div style={{marginTop:16,display:"flex",gap:32}}>
                    <div>
                      <div><b>Cliente:</b> {order.client_name}</div>
                      <ClientReviewForm
                        clientId={order.client_id}
                        orderId={order.id}
                        onSuccess={() => {
                          alert("Avaliação do cliente enviada!");
                          setHighlightOrderId(null);
                        }}
                      />
                    </div>
                    <div>
                      <div><b>Entregador:</b> {order.deliveryman_name}</div>
                      <DeliveryReviewForm
                        deliverymanId={order.deliveryman_id}
                        orderId={order.id}
                        onSuccess={() => {
                          alert("Avaliação do entregador enviada!");
                          setHighlightOrderId(null);
                        }}
                      />
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
