import React, { useMemo } from 'react';

/**
 * Campo de peso do item, com unidade e com a CONSEQUÊNCIA à vista.
 *
 * ── O QUE ACONTECEU, E POR QUE ESTE ARQUIVO EXISTE ─────────────────────────
 *
 * Uma lata de Coca-Cola 350ml foi cadastrada com "300" num campo em QUILOS.
 * Quem digitou pensava em gramas. O sistema acreditou: 300 kg exigem veículo
 * utilitário, e o adicional de carga entrou no frete. Um cliente pedindo uma
 * latinha viu R$ 25,91 de entrega, quase o triplo do certo. Ninguém foi
 * avisado de nada — nem na hora de salvar, nem depois.
 *
 * Descoberto em 29/08/2026, num pedido de teste do Diego.
 *
 * ── POR QUE UNIDADE ESCOLHÍVEL, E NÃO SÓ UM AVISO ──────────────────────────
 *
 * A confusão não é descuido: as pessoas pensam em GRAMA pra coisa pequena
 * (uma lata é "350") e em QUILO pra coisa grande (um saco de ração é "30").
 * Forçar uma unidade só garante que metade vai errar — e sempre por mil,
 * que é o fator que estraga o frete.
 *
 * Com o seletor, cada um digita no número que tem na cabeça. O valor
 * guardado continua sempre em kg.
 *
 * ── E POR QUE MOSTRAR O VEÍCULO ────────────────────────────────────────────
 *
 * O aviso decisivo não é "confirma?", é ver que 300 kg significam UTILITÁRIO
 * e frete mais caro. Aí o erro fica óbvio sem ninguém precisar entender a
 * regra: quem vende ração de 30 kg lê "carro" e confirma; quem digitou grama
 * por engano lê "utilitário" numa lata e percebe na hora.
 */

// Espelha _PADRAO_KG do backend (utils/carga.py). São os padrões — o admin
// pode mudar por configuração, e aí este texto vira aproximação. É aviso, não
// cobrança: quem decide o frete é o servidor.
const FAIXAS = [
  { ate: 8,   veiculo: 'bicicleta', extra: null },
  { ate: 20,  veiculo: 'moto',      extra: null },
  { ate: 80,  veiculo: 'carro',     extra: 'encarece o frete' },
  { ate: 300, veiculo: 'utilitário', extra: 'encarece bastante o frete' },
];

function faixaDe(kg) {
  if (!(kg > 0)) return null;
  return FAIXAS.find((f) => kg <= f.ate) || null;
}

export default function CampoPeso({ valorKg, unidade, onChange, obrigatorio }) {
  const kg = useMemo(() => {
    const n = parseFloat(String(valorKg ?? '').replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return 0;
    return unidade === 'g' ? n / 1000 : n;
  }, [valorKg, unidade]);

  const faixa = faixaDe(kg);
  const pesado = kg > 20;          // a partir daqui já exige carro
  const impossivel = kg > 300;     // nem o maior veículo leva

  return (
    <div className="flex-1">
      <label htmlFor="peso_valor" className="block text-sm font-medium text-gray-700">
        Peso {obrigatorio && <span className="text-red-500">*</span>}
      </label>

      <div className="mt-1 flex gap-2">
        <input
          type="number"
          name="peso_valor"
          id="peso_valor"
          step="any"
          min="0"
          inputMode="decimal"
          placeholder={unidade === 'g' ? 'ex: 350' : 'ex: 15'}
          value={valorKg ?? ''}
          onChange={(e) => onChange({ valor: e.target.value, unidade })}
          required={obrigatorio}
          className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
        />
        {/* Unidade ao lado do número, não escondida no rótulo: é justamente o
            que passou despercebido quando alguém digitou grama num campo de
            quilo. */}
        <select
          aria-label="Unidade do peso"
          value={unidade}
          onChange={(e) => onChange({ valor: valorKg, unidade: e.target.value })}
          className="shrink-0 rounded-md border border-gray-300 px-2 py-2 text-base shadow-sm focus:border-primary focus:outline-none focus:ring-primary"
        >
          <option value="g">g</option>
          <option value="kg">kg</option>
        </select>
      </div>

      {/* A CONSEQUÊNCIA, ao vivo. É isto que faz o erro aparecer. */}
      {kg > 0 && (
        <p
          className={`mt-1 text-xs font-medium ${
            impossivel ? 'text-red-600' : pesado ? 'text-amber-700' : 'text-gray-500'
          }`}
        >
          {impossivel ? (
            <>
              {kg.toLocaleString('pt-BR')} kg — <strong>nenhum veículo da plataforma leva isso.</strong>{' '}
              Ninguém vai conseguir aceitar o pedido. Confira se você quis dizer gramas.
            </>
          ) : (
            <>
              Fica gravado como <strong>{kg.toLocaleString('pt-BR')} kg</strong>
              {faixa && <> — vai de <strong>{faixa.veiculo}</strong></>}
              {faixa?.extra && <>, {faixa.extra}</>}
              {pesado && !impossivel && '. Confira se não era em gramas.'}
            </>
          )}
        </p>
      )}

      <p className="mt-1 text-xs text-gray-500">
        {obrigatorio
          ? 'Obrigatório no seu segmento. É o peso que define o frete e se o pedido cabe numa moto ou precisa de carro.'
          : 'Preencha em itens pesados (ração, gás, bebida em fardo). Item leve pode ficar em branco.'}
      </p>
    </div>
  );
}
