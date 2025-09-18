import React from 'react';

// Componente para o badge de status
const StatusBadge = ({ status }) => {
  const statusColors = {
    'Pendente': 'bg-yellow-100 text-yellow-800',
    'Aceito': 'bg-blue-100 text-blue-800',
    'Preparando': 'bg-indigo-100 text-indigo-800',
    'Pronto': 'bg-purple-100 text-purple-800',
    'Concluído': 'bg-green-100 text-green-800',
    'Cancelado': 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

export default function OrderCard({ order, onUpdateStatus, onViewDetails }) {
  const getNextAction = () => {
    switch (order.status) {
      case 'Pendente': return { text: 'Aceitar', nextStatus: 'Aceito' };
      case 'Aceito': return { text: 'Preparar', nextStatus: 'Preparando' };
      case 'Preparando': return { text: 'Pronto', nextStatus: 'Pronto' };
      default: return null;
    }
  };

  const mainAction = getNextAction();
  const orderItems = order.items?.items || [];

  return (
    // Card principal agora tem altura mínima para consistência
    <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col justify-between gap-4 hover:shadow-lg transition-shadow duration-200 min-h-[160px]">
      {/* Informações do pedido */}
      <div className="cursor-pointer" onClick={() => onViewDetails(order)}>
        <div className="flex items-center justify-between gap-4 mb-2">
          {/* ID do pedido agora é menor e trunca se for muito grande */}
          <h3 className="text-base font-bold text-gray-800 truncate">Pedido #{order.id.substring(0, 8)}...</h3>
          <StatusBadge status={order.status} />
        </div>
        <div className="text-sm text-gray-600 space-y-1 pl-1">
           {/* ID do cliente também foi truncado */}
          <p className="truncate"><span className="font-semibold">Cliente:</span> {order.client_id || 'N/A'}</p>
          <ul className="list-inside">
            {orderItems.map((item, index) => (<li key={index} className="truncate">{item.quantity}x {item.name}</li>))}
          </ul>
        </div>
      </div>

      {/* Ações e Valor */}
      <div className="border-t pt-3 flex items-center justify-between gap-2">
         <p className="text-lg font-bold text-gray-900 whitespace-nowrap">
           {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount)}
         </p>
         <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
           {mainAction && (
             <button onClick={() => onUpdateStatus(order.id, mainAction.nextStatus)} className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap">
               {mainAction.text}
             </button>
           )}
           {order.status !== 'Concluído' && order.status !== 'Cancelado' && (
              <button onClick={() => onUpdateStatus(order.id, 'Cancelado')} className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                Cancelar
             </button>
           )}
         </div>
      </div>
    </div>
  );
}
