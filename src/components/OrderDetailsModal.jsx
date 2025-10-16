// src/components/OrderDetailsModal.jsx - VERSÃO CORRIGIDA

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { orderService } from '../services/orderService';
import { useToast } from '../context/ToastContext.jsx'; 

export function OrderDetailsModal({ order, onClose }) {
  const [fullOrderDetails, setFullOrderDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchDetails = async () => {
      if (!order || !order.id) {
        setIsLoading(false);
        setError("ID do pedido inválido.");
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        const details = await orderService.getOrderDetails(order.id);
        setFullOrderDetails(details);
      } catch (err) {
        console.error("Erro ao buscar detalhes do pedido:", err);
        const errorMessage = err.message || "Não foi possível carregar os detalhes do pedido.";
        setError(errorMessage);
        addToast(errorMessage, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [order, addToast]);

  // ✅ Função auxiliar para formatar valores de forma segura
  const formatCurrency = (value) => {
    const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(numValue);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-100 text-yellow-800';
      case 'Aceito': return 'bg-blue-100 text-blue-800';
      case 'Preparando': return 'bg-indigo-100 text-indigo-800';
      case 'Pronto': return 'bg-purple-100 text-purple-800';
      case 'Aguardando Retirada': return 'bg-pink-100 text-pink-800';
      case 'accepted_by_delivery': return 'bg-pink-100 text-pink-800';
      case 'Saiu para Entrega': return 'bg-orange-100 text-orange-800';
      case 'delivering': return 'bg-orange-100 text-orange-800';
      case 'Entregue': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'Concluído': return 'bg-green-100 text-green-800';
      case 'Cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const modalBackdropStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 2000,
  };

  return (
    <div style={modalBackdropStyle} onClick={onClose}>
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Detalhes do Pedido #{order.id ? String(order.id).substring(0, 8) : 'N/A'}...
        </h2>

        {isLoading ? (
          <p className="text-center text-gray-600 py-8">Carregando detalhes...</p>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-2">❌ {error}</p>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium"
            >
              Fechar
            </button>
          </div>
        ) : fullOrderDetails ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <p className="text-lg font-semibold text-gray-700">Status:</p>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusClass(fullOrderDetails.status)}`}>
                {fullOrderDetails.status}
              </span>
            </div>

            <div className="border-b pb-2">
              <p className="text-lg font-semibold text-gray-700 mb-1">Cliente:</p>
              <p className="text-gray-600">
                {fullOrderDetails.client_name || 
                 fullOrderDetails.client_first_name && fullOrderDetails.client_last_name
                   ? `${fullOrderDetails.client_first_name} ${fullOrderDetails.client_last_name}`
                   : 'Nome não disponível'}
              </p>
            </div>

            <div className="border-b pb-2">
              <p className="text-lg font-semibold text-gray-700 mb-1">Endereço de Entrega:</p>
              <p className="text-gray-600">
                {typeof fullOrderDetails.delivery_address === 'string' 
                  ? fullOrderDetails.delivery_address 
                  : fullOrderDetails.delivery_address?.street || 'Não informado'}
              </p>
            </div>

            {fullOrderDetails.notes && (
              <div className="border-b pb-2">
                <p className="text-lg font-semibold text-gray-700 mb-1">Observações do Cliente:</p>
                <p className="text-gray-600 italic">{fullOrderDetails.notes}</p>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Itens do Pedido:</h3>
              <ul className="space-y-2">
                {fullOrderDetails.items && fullOrderDetails.items.length > 0 ? (
                  fullOrderDetails.items.map((item, index) => (
                    <li key={index} className="flex justify-between items-center text-gray-700 py-2 border-b border-gray-100">
                      <span className="flex-1">
                        <span className="font-medium">{item.quantity || 1}x</span> {item.name || 'Item sem nome'}
                      </span>
                      {/* ✅ CORRIGIDO: Usando formatCurrency ao invés de toFixed */}
                      <span className="font-medium">{formatCurrency(item.price)}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500 py-4 text-center">Nenhum item listado neste pedido.</li>
                )}
              </ul>
            </div>

            {/* Subtotal e Taxas */}
            {fullOrderDetails.total_amount_items && (
              <div className="pt-2 space-y-1">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal dos Itens:</span>
                  <span>{formatCurrency(fullOrderDetails.total_amount_items)}</span>
                </div>
                {fullOrderDetails.delivery_fee && (
                  <div className="flex justify-between text-gray-700">
                    <span>Taxa de Entrega:</span>
                    <span>{formatCurrency(fullOrderDetails.delivery_fee)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Total */}
            <div className="text-right pt-4 border-t-2 border-gray-300">
              <p className="text-xl font-bold text-gray-900">
                Total do Pedido: {formatCurrency(fullOrderDetails.total_amount)}
              </p>
            </div>

            {/* Botão Fechar */}
            <div className="pt-4">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-600 py-8">Detalhes do pedido não disponíveis.</p>
        )}
      </div>
    </div>
  );
}
