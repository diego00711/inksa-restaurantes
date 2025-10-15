// src/components/OrderCard.jsx (COM BOTÃO CONFIRMAR RETIRADA)

import React from 'react';
import { Package } from 'lucide-react';

// Componente para o badge de status
const StatusBadge = ({ status }) => {
  const statusColors = {
    'Pendente': 'bg-yellow-100 text-yellow-800',
    'Aceito': 'bg-blue-100 text-blue-800',
    'Preparando': 'bg-indigo-100 text-indigo-800',
    'Pronto': 'bg-purple-100 text-purple-800',
    'Saiu para Entrega': 'bg-orange-100 text-orange-800',
    'Entregue': 'bg-green-100 text-green-800',
    'Concluído': 'bg-green-100 text-green-800',
    'Cancelado': 'bg-red-100 text-red-800',
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

export default function OrderCard({ order, onUpdateStatus, onViewDetails, onConfirmPickup }) {
  const getNextAction = () => {
    switch (order.status) {
      case 'Pendente': 
        return { text: 'Aceitar', nextStatus: 'Aceito' };
      case 'Aceito': 
        return { text: 'Preparar', nextStatus: 'Preparando' };
      case 'Preparando': 
        return { text: 'Pronto', nextStatus: 'Pronto' };
      case 'Pronto':
        return { text: 'Saiu para Entrega', nextStatus: 'Saiu para Entrega' };
      // ✅ REMOVIDO: Não mostramos mais botão de status para "Saiu para Entrega"
      // O botão "Confirmar Retirada" será mostrado separadamente
      default: 
        return null;
    }
  };

  // ✅ NOVA FUNÇÃO: Verifica se deve mostrar botão de confirmar retirada
  const shouldShowPickupButton = () => {
    return order.status === 'Saiu para Entrega' || 
           order.status === 'delivering' || 
           order.status === 'Entregando';
  };

  const mainAction = getNextAction();
  const orderItems = order.items?.items || [];
  const showPickupButton = shouldShowPickupButton();

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col justify-between gap-4 hover:shadow-lg transition-shadow duration-200 min-h-[160px]">
      {/* Informações do pedido */}
      <div className="cursor-pointer" onClick={() => onViewDetails(order)}>
        <div className="flex items-center justify-between gap-4 mb-2">
          <h3 className="text-base font-bold text-gray-800 truncate">
            Pedido #{order.id.substring(0, 8)}...
          </h3>
          <StatusBadge status={order.status} />
        </div>
        
        <div className="text-sm text-gray-600 space-y-1 pl-1">
          <p className="truncate">
            <span className="font-semibold">Cliente:</span> {order.client_id || 'N/A'}
          </p>
          
          <ul className="list-inside">
            {orderItems.map((item, index) => (
              <li key={index} className="truncate">
                {item.quantity}x {item.name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Ações e Valor */}
      <div className="border-t pt-3 flex items-center justify-between gap-2">
        <p className="text-lg font-bold text-gray-900 whitespace-nowrap">
          {new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
          }).format(order.total_amount)}
        </p>
        
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {/* ✅ NOVO: Botão Confirmar Retirada para pedidos "Em Rota" */}
          {showPickupButton && onConfirmPickup ? (
            <button 
              onClick={() => onConfirmPickup(order)} 
              className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 whitespace-nowrap flex items-center gap-1"
            >
              <Package size={14} />
              Confirmar Retirada
            </button>
          ) : (
            <>
              {/* Botão normal de avançar status */}
              {mainAction && (
                <button 
                  onClick={() => onUpdateStatus(order.id, mainAction.nextStatus)} 
                  className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap"
                >
                  {mainAction.text}
                </button>
              )}
              
              {/* Botão Cancelar */}
              {order.status !== 'Concluído' && order.status !== 'Cancelado' && order.status !== 'Entregue' && (
                <button 
                  onClick={() => onUpdateStatus(order.id, 'Cancelado')} 
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Cancelar
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
