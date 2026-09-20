// Local: src/components/restaurant-portal/FaixaDaCategoria.jsx
//
// "HOJE VOCÊ É X E REPASSA Y%" — a faixa no topo do painel do parceiro.
//
// Substitui o selo que só aparecia pro Parceiro Fundador. O selo antigo tinha
// um defeito de desenho: quem NÃO era fundador não via nada, e portanto não
// tinha ideia de quanto pagava nem de que existia um jeito de pagar menos. O
// benefício só existia pra quem já tinha; pra todo o resto, o painel era mudo
// justamente sobre a pergunta que todo parceiro faz.
//
// Agora todo mundo vê a sua situação, sempre. Quem tem benefício vê o que tem
// (e até quando); quem não tem vê o número cheio e o caminho pra baixá-lo.
//
// ⚠️ O NÚMERO VEM DO BACKEND, DA MESMA CONTA QUE COBRA.
// `/api/restaurant/minha-taxa` deriva de `commission_breakdown`, que é a função
// que a cobrança usa. A categoria vem junto, já decidida e já com o rótulo
// pronto. Nada aqui recalcula taxa nem escolhe nome: se esta tela tivesse a
// própria opinião sobre "quem é fundador", bastaria uma campanha nova pra ela
// dizer uma coisa e a fatura cobrar outra — e o parceiro descobriria a
// divergência no extrato, que é o pior lugar possível.
//
// ⚠️ FALHOU, NÃO MOSTRA. Sem resposta do backend a faixa some inteira. A
// tentação é cair num padrão ("15%") enquanto carrega; seria mentir pro
// fundador que paga 7,5%. Faixa ausente é ruído; faixa errada é prejuízo.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RESTAURANT_API_URL, createAuthHeaders } from '../../services/api';
import { numeroBR } from '../../utils/dinheiro.js';

// A cara de cada categoria. Fica num mapa e não em `if`s espalhados porque a
// próxima campanha é uma linha aqui — do mesmo jeito que o rótulo, no backend,
// é uma linha em ROTULO_CATEGORIA.
const VISUAL = {
  embaixador: {
    emoji: '🌟',
    caixa: 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50',
    titulo: 'text-emerald-900',
    corpo: 'text-emerald-800',
    nota: 'text-emerald-700',
  },
  fundador: {
    emoji: '🏆',
    caixa: 'border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50',
    titulo: 'text-orange-900',
    corpo: 'text-orange-800',
    nota: 'text-orange-700',
  },
  padrao: {
    emoji: '🏪',
    caixa: 'border-slate-200 bg-slate-50',
    titulo: 'text-slate-900',
    corpo: 'text-slate-700',
    nota: 'text-slate-500',
  },
};

// O Clube não é uma categoria só: cada nível tem identidade própria, e o
// parceiro reconhece o nível dele pela cor antes de ler a palavra.
const VISUAL_CLUBE = {
  bronze:   { emoji: '🥉', caixa: 'border-amber-300 bg-amber-50',   titulo: 'text-amber-900',   corpo: 'text-amber-800',   nota: 'text-amber-700' },
  prata:    { emoji: '🥈', caixa: 'border-slate-300 bg-slate-50',   titulo: 'text-slate-900',   corpo: 'text-slate-700',   nota: 'text-slate-600' },
  ouro:     { emoji: '🥇', caixa: 'border-yellow-300 bg-yellow-50', titulo: 'text-yellow-900',  corpo: 'text-yellow-800',  nota: 'text-yellow-700' },
  diamante: { emoji: '💎', caixa: 'border-cyan-300 bg-cyan-50',     titulo: 'text-cyan-900',    corpo: 'text-cyan-800',    nota: 'text-cyan-700' },
};

function visualDe(categoria, nivel) {
  if (categoria === 'clube') {
    const chave = String(nivel || '').trim().toLowerCase();
    return VISUAL_CLUBE[chave] || VISUAL.padrao;
  }
  return VISUAL[categoria] || VISUAL.padrao;
}

// Meio-dia, não meia-noite: `new Date('2026-12-31')` é lido como UTC, e no
// fuso do Brasil isso volta um dia — a data apareceria como 30/12. Já mordeu
// neste mesmo arquivo (o selo do fundador tem a mesma linha).
function diaLocal(iso) {
  if (!iso) return null;
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const porExtenso = (d) =>
  d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

// 15 → "15", 7,5 → "7,5", 12,25 → "12,25". `numeroBR` cravado em 2 casas
// escreveria "15,00%", que finge uma precisão que a taxa não tem e ainda faz
// o número parecer maior do que é na leitura rápida.
const pctBR = (n) =>
  numeroBR(n, Number.isInteger(n) ? 0 : (Number.isInteger(n * 10) ? 1 : 2));

export function FaixaDaCategoria() {
  const [taxa, setTaxa] = useState(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await fetch(`${RESTAURANT_API_URL}/api/restaurant/minha-taxa`, {
          headers: createAuthHeaders(),
        });
        const j = await r.json();
        if (!r.ok || j?.status !== 'success') return;
        if (vivo) setTaxa(j.data);
      } catch {
        // Silêncio de propósito: ver o aviso no topo do arquivo. Isto é um
        // enfeite informativo, não pode virar um toast de erro no rosto de
        // quem só queria ver os pedidos.
      }
    })();
    return () => { vivo = false; };
  }, []);

  if (!taxa) return null;

  const categoria = taxa.categoria || 'padrao';
  const pct = Number(taxa.taxa_entrega_pct);
  if (!Number.isFinite(pct)) return null;

  const v = visualDe(categoria, taxa.clube_nivel);
  const rotulo = taxa.categoria_rotulo || 'Parceiro';
  const zerado = pct <= 0;

  // Até quando o benefício vale. Embaixador tem data de campanha; Fundador tem
  // a janela de 6 meses dele. Quem está no Clube não tem prazo — o nível é
  // reconquistado todo mês —, então a frase muda de "até tal dia" pra "este
  // mês", que é a verdade.
  const ate = diaLocal(taxa.categoria_ate)
    || (categoria === 'fundador' ? diaLocal(taxa.fundador_ate) : null);
  const hoje = new Date(new Date().toDateString());
  const dias = ate ? Math.ceil((ate - hoje) / 86400000) : null;

  return (
    <div className={`mb-4 rounded-xl border p-4 ${v.caixa}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none shrink-0" aria-hidden="true">{v.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className={`font-bold ${v.titulo}`}>
            Hoje você é <span className="whitespace-nowrap">{rotulo}</span>
          </p>

          <p className={`text-sm mt-0.5 ${v.corpo}`}>
            {zerado ? (
              <>Você <strong>não repassa nada</strong> à Inksa.</>
            ) : (
              <>Você repassa <strong>{pctBR(pct)}%</strong> à Inksa por pedido entregue.</>
            )}
            {ate && (
              <>
                {' '}Vale até <strong>{porExtenso(ate)}</strong>
                {/* O aviso de prazo só aparece perto do fim. Mostrar "faltam
                    180 dias" o ano inteiro transforma urgência em papel de
                    parede, e aí ela não funciona no mês em que precisaria. */}
                {dias !== null && dias <= 45 && (
                  <> — <strong>faltam {dias} {dias === 1 ? 'dia' : 'dias'}</strong></>
                )}
                .
              </>
            )}
          </p>

          {/* A terceira linha é sempre "e daí?": o que fazer com essa
              informação. Muda conforme a categoria porque o próximo passo de
              cada uma é diferente de verdade. */}
          {categoria === 'embaixador' && (
            <p className={`text-xs mt-1 ${v.nota}`}>
              Cortesia de quem está com a gente desde o começo. Aproveite a janela:
              tudo que vender neste período é seu, sem desconto nenhum.
            </p>
          )}
          {categoria === 'fundador' && (
            <p className={`text-xs mt-1 ${v.nota}`}>
              Benefício de quem entrou no começo. Obrigado por acreditar na gente.
            </p>
          )}
          {categoria === 'clube' && (
            <p className={`text-xs mt-1 ${v.nota}`}>
              Você conquistou este nível vendendo.{' '}
              <Link to="/clube" className="underline font-semibold">Ver o Clube</Link>
              {' '}e o que falta pro próximo.
            </p>
          )}
          {categoria === 'padrao' && (
            <p className={`text-xs mt-1 ${v.nota}`}>
              Vendendo mais você sobe de nível no Clube e passa a repassar menos.{' '}
              <Link to="/clube" className="underline font-semibold">Ver como funciona</Link>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default FaixaDaCategoria;
