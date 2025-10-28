// src/components/OrderCard.jsx - VERSÃO CORRIGIDA

import React from 'react';
import { Package } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const statusColors = {
    'Pendente': 'bg-yellow-100 text-yellow-800',
    'Aceito': 'bg-blue-100 text-blue-800',
    'Preparando': 'bg-indigo-100 text-indigo-800',
    'Pronto': 'bg-purple-100 text-purple-800',
    'Aguardando Retirada': 'bg-pink-100 text-pink-800',
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
        return { text: 'Aceitar', nextStatus: 'preparing' }; // ✅ Status em inglês
      case 'Aceito': 
        return { text: 'Preparar', nextStatus: 'preparing' }; // ✅ Status em inglês
      case 'Preparando': 
        return { text: 'Pronto', nextStatus: 'ready' }; // ✅ Status em inglês
      case 'Pronto':
        return { text: 'Saiu para Entrega', nextStatus: 'ready_for_pickup' }; // ✅ CORREÇÃO PRINCIPAL!
      default: 
        return null;
    }
  };

  // ✅ Verifica se deve mostrar botão de confirmar retirada
  const shouldShowPickupButton = () => {
    return order.status === 'Aguardando Retirada' || 
           order.status === 'accepted_by_delivery';
  };

  const mainAction = getNextAction();
  const orderItems = order.items?.items || [];
  const showPickupButton = shouldShowPickupButton();

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col gap-3 hover:shadow-lg transition-shadow duration-200">
      {/* Informações do pedido */}
      <div className="cursor-pointer" onClick={() => onViewDetails(order)}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-sm font-bold text-gray-800 truncate">
            Pedido #{order.id.substring(0, 8)}...
          </h3>
          <StatusBadge status={order.status} />
        </div>
        
        <div className="text-xs text-gray-600 space-y-1">
          <p className="truncate">
            <span className="font-semibold">Cliente:</span> {order.client_id?.substring(0, 20) || 'N/A'}...
          </p>
          
          {orderItems.length > 0 && (
            <div className="mt-1">
              <p className="font-semibold text-gray-700 mb-0.5">Itens:</p>
              <ul className="list-none space-y-0.5">
                {orderItems.slice(0, 3).map((item, index) => (
                  <li key={index} className="text-xs truncate pl-2">
                    • {item.quantity}x {item.name}
                  </li>
                ))}
                {orderItems.length > 3 && (
                  <li className="text-xs text-gray-500 pl-2">
                    + {orderItems.length - 3} item(ns)
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Valor e Ações */}
      <div className="border-t pt-3 flex flex-col gap-2">
        <p className="text-lg font-bold text-gray-900">
          {new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
          }).format(order.total_amount)}
        </p>
        
        <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          {/* ✅ Botão Confirmar Retirada para "Aguardando Retirada" */}
          {showPickupButton && onConfirmPickup ? (
            <button 
              onClick={() => onConfirmPickup(order)} 
              className="w-full px-3 py-2 text-xs font-medium text-white bg-purple-600 rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center justify-center gap-1.5"
            >
              <Package size={14} />
              Confirmar Retirada
            </button>
          ) : (
            <div className="flex gap-2">
              {/* Botão normal de avançar status */}
              {mainAction && (
                <button 
                  onClick={() => onUpdateStatus(order.id, mainAction.nextStatus)} 
                  className="flex-1 px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {mainAction.text}
                </button>
              )}
              
              {/* Botão Cancelar */}
              {order.status !== 'Concluído' && order.status !== 'Cancelado' && order.status !== 'Entregue' && (
                <button 
                  onClick={() => onUpdateStatus(order.id, 'cancelled')} 
                  className="px-3 py-2 text-xs font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  title="Cancelar pedido"
                >
                  Cancelar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
