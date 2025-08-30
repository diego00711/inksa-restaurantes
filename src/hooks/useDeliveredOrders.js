import { useEffect, useState } from "react";

// Troque por sua chamada real de API!
export default function useDeliveredOrders(restaurantId) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    // Substitua pelo fetch real dos pedidos entregues!
    setTimeout(() => {
      setOrders([
        {
          id: 101,
          client_id: 1,
          client_name: "João Cliente",
          deliveryman_id: 20,
          deliveryman_name: "Carlos Entregador",
          completed_at: Date.now() - 86400000,
        },
        {
          id: 102,
          client_id: 2,
          client_name: "Maria Cliente",
          deliveryman_id: 21,
          deliveryman_name: "Fernanda Entregadora",
          completed_at: Date.now() - 43200000,
        },
      ]);
      setLoading(false);
    }, 800);
  }, [restaurantId]);

  return { orders, loading };
}
