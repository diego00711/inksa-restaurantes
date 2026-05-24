// src/components/OrderCard.jsx  ✅ PATCH

import React, { useState } from 'react';
import { Package, CheckCircle } from 'lucide-react';

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

export default function OrderCard({ order, onUpdateStatus, onViewDetails, onConfirmPickup, onAcceptOrder }) {
  const [estimatedTime, setEstimatedTime] = useState(20);
  // ⚠️ order.status aqui é exibido em PT-BR; ao enviar para API usamos os nomes internos (inglês)

  const getNextAction = () => {
    switch (order.status) {
      case 'Pendente':
        // ✅ primeiro vai para "accepted"
        return { text: 'Aceitar', nextStatus: 'accepted' };
      case 'Aceito':
        return { text: 'Preparar', nextStatus: 'preparing' };
      case 'Preparando':
        return { text: 'Pronto', nextStatus: 'ready' };
      case 'Pronto':
        // ✅ não existe "ready_for_pickup"; usar accepted_by_delivery
        // o backend permite ready -> accepted_by_delivery via PUT /status
        return { text: 'Aguardar Retirada', nextStatus: 'accepted_by_delivery' };
      default:
        return null;
    }
  };

  // ✅ Mostrar o botão de confirmar retirada quando o pedido já foi aceito por um entregador
  const shouldShowPickupButton = () => {
    return order.status === 'Aguardando Retirada' || order.status === 'accepted_by_delivery';
  };

  const mainAction = getNextAction();
  const orderItems = order.items?.items || [];
  const showPickupButton = shouldShowPickupButton();

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 flex flex-col gap-3 hover:shadow-lg transition-shadow duration-200 ${order.status === 'Pendente' ? 'ring-2 ring-green-400 animate-pulse' : ''}`}>
      <div className="cursor-pointer" onClick={() => onViewDetails(order)}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-sm font-bold text-gray-800 truncate">
            Pedido #{String(order.id || '').substring(0, 8)}...
          </h3>
          <StatusBadge status={order.status} />
        </div>

        <div className="text-xs text-gray-600 space-y-1">
          <p className="truncate">
            <span className="font-semibold">Cliente:</span>{' '}
            {order.client_name || order.client_first_name || (order.client_id ? String(order.client_id).substring(0, 20) + '...' : 'N/A')}
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

      <div className="border-t pt-3 flex flex-col gap-2">
        <p className="text-lg font-bold text-gray-900">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
        </p>

        {/* Payment method badge */}
        {(() => {
          const method = order.payment_method;
          const changeFor = parseFloat(order.change_for || 0);
          if (method === 'cash') {
            return (
              <div className="flex flex-col gap-0.5">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-800 bg-green-100 px-2 py-1 rounded-full w-fit">
                  💵 Dinheiro
                </span>
                {changeFor > 0 && (
                  <span className="text-xs text-gray-500 pl-1">
                    Troco para {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(changeFor)}
                  </span>
                )}
              </div>
            );
          }
          if (method === 'pix') {
            return (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 bg-blue-100 px-2 py-1 rounded-full w-fit">
                📱 PIX
              </span>
            );
          }
          if (method === 'credit' || method === 'debit') {
            return (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-800 bg-purple-100 px-2 py-1 rounded-full w-fit">
                💳 Cartão
              </span>
            );
          }
          return null;
        })()}

        <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
          {showPickupButton && onConfirmPickup ? (
            <button
              onClick={() => onConfirmPickup(order)}
              className="w-full px-4 py-3 text-sm font-bold text-white bg-purple-600 rounded-xl shadow hover:bg-purple-700 transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              <Package size={16} />
              Confirmar Retirada
            </button>
          ) : order.status === 'Pendente' ? (
            /* One-touch accept: time picker + big green button */
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Tempo estimado de preparo</p>
              <div className="flex gap-1.5 flex-wrap">
                {[10, 20, 30, 45, 60].map((t) => (
                  <button
                    key={t}
                    onClick={() => setEstimatedTime(t)}
                    className={`flex-1 min-w-[2.5rem] py-1.5 text-xs font-bold rounded-lg transition-all ${
                      estimatedTime === t
                        ? 'bg-orange-500 text-white shadow'
                        : 'bg-gray-100 text-gray-600 hover:bg-orange-100'
                    }`}
                  >
                    {t}min
                  </button>
                ))}
              </div>
              <button
                onClick={() => onAcceptOrder ? onAcceptOrder(order.id, estimatedTime) : onUpdateStatus(order.id, 'accepted')}
                className="w-full px-4 py-3 text-sm font-bold text-white bg-green-600 rounded-xl shadow hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[48px]"
              >
                <CheckCircle size={18} />
                Aceitar pedido ({estimatedTime}min)
              </button>
              {order.status !== 'Concluído' && order.status !== 'Cancelado' && (
                <button
                  onClick={() => onUpdateStatus(order.id, 'cancelled')}
                  className="w-full px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                >
                  Recusar pedido
                </button>
              )}
            </div>
          ) : order.status === 'Preparando' ? (
            /* Big orange "ready" button */
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onUpdateStatus(order.id, 'ready')}
                className="w-full px-4 py-3 text-sm font-bold text-white bg-orange-500 rounded-xl shadow hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[48px]"
              >
                📦 Marcar como pronto
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              {mainAction && (
                <button
                  onClick={() => onUpdateStatus(order.id, mainAction.nextStatus)}
                  className="flex-1 px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 transition-colors min-h-[44px]"
                >
                  {mainAction.text}
                </button>
              )}
              {order.status !== 'Concluído' && order.status !== 'Cancelado' && order.status !== 'Entregue' && (
                <button
                  onClick={() => onUpdateStatus(order.id, 'cancelled')}
                  className="px-3 py-2 text-xs font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 transition-colors min-h-[44px]"
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
