// src/components/OrderDetailsModal.jsx

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
// Importa do novo orderService
import { orderService } from '../services/orderService';
import { useToast } from '../context/ToastContext.jsx'; 

export function OrderDetailsModal({ order, onClose }) {
  const [fullOrderDetails, setFullOrderDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchDetails = async () => {
      // Guarda de segurança para garantir que o pedido e o ID existem
      if (!order || !order.id) {
        setIsLoading(false);
        setError("ID do pedido inválido.");
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        // Chamando a função do serviço correto
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
  }, [order, addToast]); // Dependências do useEffect

  // Formata o valor total para a moeda local (BRL)
  const formattedTotalAmount = new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(parseFloat(fullOrderDetails?.total_amount || 0));

  // Define a classe de cor com base no status do pedido
  const getStatusClass = (status) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-100 text-yellow-800';
      case 'Aceito': return 'bg-blue-100 text-blue-800';
      case 'Em Preparo': return 'bg-purple-100 text-purple-800';
      case 'Pronto para Entrega': return 'bg-indigo-100 text-indigo-800';
      case 'Concluído': return 'bg-green-100 text-green-800';
      case 'Cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Estilos para o fundo do modal
  const modalBackdropStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 2000,
  };

  return (
    <div style={modalBackdropStyle} onClick={onClose}>
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl relative" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">Detalhes do Pedido #{order.id ? String(order.id).slice(-4) : 'N/A'}</h2>

        {isLoading ? (
          <p className="text-center text-gray-600">Carregando detalhes...</p>
        ) : error ? (
          <p className="text-center text-red-500">Erro: {error}</p>
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
              <p className="text-gray-600">{fullOrderDetails.client_name || 'Nome não disponível'}</p>
            </div>

            <div className="border-b pb-2">
              <p className="text-lg font-semibold text-gray-700 mb-1">Endereço de Entrega:</p>
              <p className="text-gray-600">{fullOrderDetails.delivery_address || 'Não informado'}</p>
            </div>

            <div className="border-b pb-2">
              <p className="text-lg font-semibold text-gray-700 mb-1">Observações do Cliente:</p>
              <p className="text-gray-600 italic">{fullOrderDetails.notes || 'Nenhuma observação.'}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Itens do Pedido:</h3>
              <ul className="space-y-2">
                {fullOrderDetails.items && fullOrderDetails.items.length > 0 ? (
                  fullOrderDetails.items.map((item, index) => (
                    <li key={index} className="flex justify-between items-center text-gray-700">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-medium">R$ {parseFloat(item.price || 0).toFixed(2)}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">Nenhum item listado neste pedido.</li>
                )}
              </ul>
            </div>

            <div className="text-right pt-4 border-t border-gray-200">
              <p className="text-xl font-bold text-gray-900">Total do Pedido: {formattedTotalAmount}</p>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-600">Detalhes do pedido não disponíveis.</p>
        )}
      </div>
    </div>
  );
}