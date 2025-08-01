import React from 'react';

// Este componente recebe o status do restaurante como uma propriedade (prop)
// e decide o que renderizar com base nesse status.
export function RestaurantStatus({ isOpen }) {

  // Se 'isOpen' for verdadeiro, mostra a mensagem de ABERTO
  if (isOpen) {
    return (
      <div className="p-3 my-4 text-center rounded-lg bg-green-100 border border-green-300 shadow-sm">
        <span className="font-bold text-lg text-green-800">✅ Restaurante Aberto</span>
        <p className="text-sm text-green-700 mt-1">Já pode fazer o seu pedido!</p>
      </div>
    );
  }

  // Se 'isOpen' for falso, mostra a mensagem de FECHADO
  return (
    <div className="p-3 my-4 text-center rounded-lg bg-red-100 border border-red-300 shadow-sm">
      <span className="font-bold text-lg text-red-800">❌ Restaurante Fechado</span>
      <p className="text-sm text-red-700 mt-1">O restaurante não está a aceitar pedidos de momento.</p>
    </div>
  );
}