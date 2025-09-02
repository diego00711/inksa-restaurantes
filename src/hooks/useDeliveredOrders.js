// src/hooks/useDeliveredOrders.js

import { useState, useEffect } from 'react';
// ✅ 1. Importa o serviço de pedidos que contém a nova função
import { orderService } from '../services/orderService';

/**
 * Custom Hook para buscar e gerenciar a lista de pedidos entregues
 * que estão pendentes de avaliação por parte do restaurante.
 * @param {string} restaurantId - O ID do restaurante.
 */
export default function useDeliveredOrders(restaurantId) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Não executa a busca se o ID do restaurante não estiver disponível
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    // AbortController para cancelar a requisição se o componente for desmontado
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        // ✅ 2. Chama a função REAL da API em vez de usar dados mockados
        const pendingOrders = await orderService.getOrdersPendingReview(restaurantId, signal);
        setOrders(pendingOrders || []); // Garante que 'orders' seja sempre um array
      } catch (err) {
        // Ignora o erro se for por cancelamento da requisição
        if (err.name !== 'AbortError') {
          console.error("Erro ao buscar pedidos pendentes:", err);
          setError(err.message || "Não foi possível carregar os pedidos para avaliação.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // ✅ 3. Função de limpeza que cancela a requisição da API
    return () => {
      controller.abort();
    };
  }, [restaurantId]); // O hook re-executa se o restaurantId mudar

  return { orders, loading, error };
}
