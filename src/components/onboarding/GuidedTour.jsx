// src/components/onboarding/GuidedTour.jsx
// Controle via localStorage: chave "inksa_tour_done"
// Ao concluir/pular: localStorage.setItem('inksa_tour_done', 'true')

import React, { useState } from 'react';

const STEPS = [
  {
    titulo: 'Menu lateral',
    desc: 'Navegue entre as seções do painel',
  },
  {
    titulo: 'Pedidos',
    desc: 'Veja e confirme os pedidos recebidos em tempo real',
  },
  {
    titulo: 'Cardápio',
    desc: 'Gerencie seus produtos e preços aqui',
  },
  {
    titulo: 'Relatórios',
    desc: 'Acompanhe vendas e desempenho do restaurante',
  },
];

export default function GuidedTour({ onComplete }) {
  const [current, setCurrent] = useState(0);

  const finish = () => {
    localStorage.setItem('inksa_tour_done', 'true');
    onComplete();
  };

  const goNext = () => {
    if (current < STEPS.length - 1) {
      setCurrent((prev) => prev + 1);
    } else {
      finish();
    }
  };

  const skip = () => {
    finish();
  };

  const step = STEPS[current];
  const isLast = current === STEPS.length - 1;

  return (
    <>
      {/* Overlay escuro */}
      <div className="fixed inset-0 z-40 bg-black/60" />

      {/* Tooltip fixo no centro-inferior */}
      <div className="fixed bottom-8 left-4 right-4 bg-white rounded-2xl shadow-2xl p-5 z-50 max-w-sm mx-auto">
        <p className="font-bold text-lg text-gray-900">{step.titulo}</p>
        <p className="text-gray-600 text-sm mt-1">{step.desc}</p>
        <p className="text-xs text-gray-400 mt-3">
          Passo {current + 1} de {STEPS.length}
        </p>

        <div className="flex items-center justify-between mt-4 gap-3">
          <button
            onClick={skip}
            className="text-gray-400 text-sm font-medium min-h-[44px] px-2"
          >
            Pular tour
          </button>
          <button
            onClick={goNext}
            className="bg-[#FF6F00] text-white rounded-full min-h-[44px] px-6 font-semibold text-sm shadow-md active:opacity-90 transition-opacity"
          >
            {isLast ? 'Concluir' : 'Próximo'}
          </button>
        </div>
      </div>
    </>
  );
}
