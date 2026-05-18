// src/components/onboarding/OnboardingSlides.jsx
// Controle via localStorage: chave "inksa_onboarding_done"
// Exibir se localStorage.getItem('inksa_onboarding_done') !== 'true'
// Ao concluir/pular: localStorage.setItem('inksa_onboarding_done', 'true')

import React, { useState } from 'react';

const SLIDES = [
  {
    emoji: '🏪',
    titulo: 'Gerencie seus pedidos',
    desc: 'Receba e confirme pedidos em tempo real',
  },
  {
    emoji: '📊',
    titulo: 'Acompanhe suas vendas',
    desc: 'Relatórios e métricas do seu restaurante',
  },
  {
    emoji: '🚀',
    titulo: 'Cresça com a Inksa',
    desc: 'Alcance mais clientes em Lages e região',
  },
];

export default function OnboardingSlides({ onComplete }) {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  const finish = () => {
    localStorage.setItem('inksa_onboarding_done', 'true');
    onComplete();
  };

  const goNext = () => {
    if (current < SLIDES.length - 1) {
      setVisible(false);
      setTimeout(() => {
        setCurrent((prev) => prev + 1);
        setVisible(true);
      }, 300);
    } else {
      finish();
    }
  };

  const skip = () => {
    finish();
  };

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-between py-10 px-4">
      {/* Botão Pular — visível nos slides 1 e 2 */}
      <div className="w-full flex justify-end max-w-xs">
        {!isLast ? (
          <button
            onClick={skip}
            className="text-gray-400 text-sm font-medium min-h-[44px] px-2"
          >
            Pular
          </button>
        ) : (
          <div className="min-h-[44px]" />
        )}
      </div>

      {/* Conteúdo do slide */}
      <div
        className={`flex flex-col items-center gap-6 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="text-8xl select-none">{slide.emoji}</span>
        <h2 className="text-2xl font-bold text-[#FF6F00] text-center">{slide.titulo}</h2>
        <p className="text-gray-600 text-center px-8 text-base leading-relaxed">{slide.desc}</p>
      </div>

      {/* Parte inferior: bolinhas + botão */}
      <div className="flex flex-col items-center gap-6 w-full max-w-xs">
        {/* Bolinhas de progresso */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-6 h-2.5 bg-[#FF6F00]'
                  : 'w-2.5 h-2.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Botão Próximo / Começar */}
        <button
          onClick={goNext}
          className="bg-[#FF6F00] text-white rounded-full min-h-[44px] w-full max-w-xs font-semibold text-base shadow-md active:opacity-90 transition-opacity"
        >
          {isLast ? 'Começar' : 'Próximo'}
        </button>
      </div>
    </div>
  );
}
