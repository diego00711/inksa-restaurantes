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

export default function OrderCard({ order, isOwnDelivery = false, onUpdateStatus, onViewDetails, onConfirmPickup, onAcceptOrder }) {
  const [estimatedTime, setEstimatedTime] = useState(20);
  // Trava de clique único: sem isto, dois toques rápidos em Aceitar/Pronto/etc.
  // disparam a mesma ação 2x e o backend devolve erro (status já mudou),
  // confundindo o dono. Enquanto uma ação está em voo, todos os botões travam.
  const [busy, setBusy] = useState(false);
  const run = async (fn, ...args) => {
    if (busy || !fn) return;
    setBusy(true);
    try { await fn(...args); }
    catch { /* o toast de erro é tratado na página; aqui só libera o botão */ }
    finally { setBusy(false); }
  };
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
        // ENTREGA PRÓPRIA: o restaurante despacha com a própria moto —
        // "Saiu para Entrega" direto, sem esperar entregador Inksa.
        if (isOwnDelivery) return { text: '🛵 Saiu para Entrega', nextStatus: 'delivering' };
        // ✅ não existe "ready_for_pickup"; usar accepted_by_delivery
        // o backend permite ready -> accepted_by_delivery via PUT /status
        return { text: 'Aguardar Retirada', nextStatus: 'accepted_by_delivery' };
      case 'Saiu para Entrega':
      case 'delivering':
        // ENTREGA PRÓPRIA: o restaurante fecha a entrega ele mesmo (sem código
        // de entregador). O backend só libera delivered pra delivery_type='own'.
        if (isOwnDelivery) return { text: '✅ Confirmar Entrega', nextStatus: 'delivered' };
        return null;
      default:
        return null;
    }
  };

  // Botão de confirmar retirada só no fluxo COM entregador Inksa. Na entrega
  // própria não existe retirada por entregador — o restaurante leva ele mesmo.
  const shouldShowPickupButton = () => {
    if (isOwnDelivery) return false;
    return order.status === 'Aguardando Retirada' || order.status === 'accepted_by_delivery';
  };

  const mainAction = getNextAction();
  const orderItems = order.items?.items || [];
  const showPickupButton = shouldShowPickupButton();
  // Depois que o pedido SAIU PARA ENTREGA (em rota), o restaurante não pode mais
  // cancelar — o pedido já está com o entregador/cliente. Esconde o botão.
  const isEnRoute = ['Saiu para Entrega', 'delivering', 'Entregando'].includes(order.status);

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

          {/* Observação do cliente (ex.: "sem cebola") — destacada pra cozinha
              ver sem precisar abrir o detalhe. Vem de orders.notes. */}
          {order.notes && String(order.notes).trim() && (
            <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 px-2 py-1.5">
              <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wide mb-0.5">📝 Observação</p>
              <p className="text-xs text-amber-900 italic whitespace-pre-wrap break-words">{order.notes}</p>
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
          if (method === 'cash') {
            // O troco NÃO aparece pro restaurante — quem leva o troco é o
            // entregador, então esse dado fica só no app do entregador. Aqui só
            // sinaliza que o pagamento é em dinheiro.
            return (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-800 bg-green-100 px-2 py-1 rounded-full w-fit">
                💵 Dinheiro
              </span>
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
              onClick={() => run(onConfirmPickup, order)}
              disabled={busy}
              className="w-full px-4 py-3 text-sm font-bold text-white bg-purple-600 rounded-xl shadow hover:bg-purple-700 transition-all flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed"
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
                onClick={() => onAcceptOrder ? run(onAcceptOrder, order.id, estimatedTime) : run(onUpdateStatus, order.id, 'accepted')}
                disabled={busy}
                className="w-full px-4 py-3 text-sm font-bold text-white bg-green-600 rounded-xl shadow hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <CheckCircle size={18} />
                {busy ? 'Processando...' : `Aceitar pedido (${estimatedTime}min)`}
              </button>
              {order.status !== 'Concluído' && order.status !== 'Cancelado' && (
                <button
                  onClick={() => run(onUpdateStatus, order.id, 'cancelled')}
                  disabled={busy}
                  className="w-full px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Recusar pedido
                </button>
              )}
            </div>
          ) : order.status === 'Preparando' ? (
            /* Big orange "ready" button */
            <div className="flex flex-col gap-2">
              <button
                onClick={() => run(onUpdateStatus, order.id, 'ready')}
                disabled={busy}
                className="w-full px-4 py-3 text-sm font-bold text-white bg-orange-500 rounded-xl shadow hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? 'Processando...' : '📦 Marcar como pronto'}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              {mainAction && (
                <button
                  onClick={() => run(onUpdateStatus, order.id, mainAction.nextStatus)}
                  disabled={busy}
                  className="flex-1 px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 transition-colors min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {busy ? '...' : mainAction.text}
                </button>
              )}
              {order.status !== 'Concluído' && order.status !== 'Cancelado' && order.status !== 'Entregue' && !isEnRoute && (
                <button
                  onClick={() => run(onUpdateStatus, order.id, 'cancelled')}
                  disabled={busy}
                  className="px-3 py-2 text-xs font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 transition-colors min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
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
