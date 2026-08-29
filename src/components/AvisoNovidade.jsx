import React, { useState } from 'react';
import { X, Megaphone } from 'lucide-react';

/**
 * Aviso de novidade que o parceiro pode fechar e não vê mais.
 *
 * POR QUE ELE LEMBRA QUE FOI FECHADO, E ONDE ISSO FALHA
 *
 * A dispensa fica no localStorage, por `id`. Isso significa que ela vale por
 * NAVEGADOR, não por conta: se o parceiro abrir o painel no computador da loja
 * e depois no celular, o aviso volta a aparecer no celular uma vez. É uma
 * escolha consciente — guardar isso no servidor exigiria uma tabela e uma rota
 * pra economizar um clique.
 *
 * (Vale lembrar do que já mordeu neste projeto: navegador, navegador do
 * WhatsApp e app instalado são três localStorage separados. Pra um aviso isso
 * é irrelevante; pra qualquer coisa que envolva dinheiro ou identidade, não.)
 *
 * O `id` é a chave. Trocar o texto SEM trocar o id não faz o aviso reaparecer
 * pra quem já fechou — então, quando quiser avisar de novo, mude o id.
 */
export default function AvisoNovidade({ id, titulo, children }) {
  const chave = `inksa_aviso_${id}`;

  const [visivel, setVisivel] = useState(() => {
    // localStorage pode lançar (janela anônima, cookies bloqueados). Um aviso
    // nunca pode ser o motivo de a tela do cardápio não abrir.
    try {
      return localStorage.getItem(chave) !== 'fechado';
    } catch {
      return true;
    }
  });

  if (!visivel) return null;

  const fechar = () => {
    setVisivel(false);
    try {
      localStorage.setItem(chave, 'fechado');
    } catch {
      // Não deu pra lembrar — o aviso volta na próxima visita. Tudo bem.
    }
  };

  return (
    <div className="relative mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4 pr-11">
      <div className="flex gap-3">
        <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-semibold text-orange-900">{titulo}</p>
          <div className="mt-1 space-y-1 text-sm leading-relaxed text-orange-900/80">
            {children}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={fechar}
        aria-label="Fechar aviso"
        className="absolute right-2 top-2 rounded-md p-2 text-orange-400 transition-colors hover:bg-orange-100 hover:text-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
      >
        <X size={18} />
      </button>
    </div>
  );
}
