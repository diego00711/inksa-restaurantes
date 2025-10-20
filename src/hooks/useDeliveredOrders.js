// inksa-restaurantes/src/hooks/useDeliveredOrders.js - VERSÃO COMPLETA

import { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';

/**
 * Custom Hook para buscar pedidos entregues pendentes de avaliação (RESTAURANTE)
 * Busca pedidos onde o restaurante ainda precisa avaliar cliente/entregador
 * @param {string} restaurantId - O ID do perfil do restaurante
 */
export default function useDeliveredOrders(restaurantId) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔍 [Restaurante] Buscando pedidos pendentes de avaliação...');
        
        // ✅ Chama o endpoint específico do restaurante
        const pendingOrders = await orderService.getOrdersPendingReview(restaurantId, signal);
        
        console.log(`✅ [Restaurante] ${pendingOrders.length} pedidos pendentes encontrados`);
        
        setOrders(pendingOrders || []);
        
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('❌ [Restaurante] Erro ao buscar pedidos:', err);
          setError(err.message || "Não foi possível carregar os pedidos.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    return () => {
      controller.abort();
    };
  }, [restaurantId]);

  // ✅ Função para refazer busca (útil após criar avaliação)
  const refetch = () => {
    if (!restaurantId) return;
    
    setLoading(true);
    setError(null);
    
    orderService.getOrdersPendingReview(restaurantId)
      .then(data => setOrders(data || []))
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  };

  return { orders, loading, error, refetch };
}
