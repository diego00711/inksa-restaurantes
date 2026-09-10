// Como formar preço na Inksa, e a calculadora que faz a conta certa.
//
// POR QUE ESTA TELA EXISTE
//
// A conta que quase todo mundo faz é SOMAR a comissão: "é 15%, então ponho 15%
// a mais". Está errada, e o erro é sempre contra o parceiro.
//
//   quero receber R$ 52,00
//   somando 15%  -> R$ 59,80  ->  menos 15% de comissão  =  R$ 50,83  ✗ faltam R$ 1,17
//   dividindo    -> 52 / 0,85 =  R$ 61,18  ->  menos 15%  =  R$ 52,00  ✓
//
// Quanto maior o ticket, maior o buraco. Numa marmita de R$ 20 são centavos;
// num pedido de R$ 300 o parceiro entrega R$ 6,75 do bolso dele achando que
// está no lucro.
//
// A TAXA VEM DO SERVIDOR, NUNCA CRAVADA AQUI: quem é Parceiro Fundador paga
// metade, e quem sobe de nível no Clube paga menos. Número errado numa tela que
// ensina a formar preço é pior que não ter a tela.
import React, { useEffect, useMemo, useState } from 'react';
import { RESTAURANT_API_URL, createAuthHeaders } from '../services/api';
import { Calculator, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { brl } from '../utils/dinheiro';


export default function PrecificacaoPage() {
  const [taxa, setTaxa] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  // Começa com o exemplo que o Diego usou ao pedir a tela.
  const [quero, setQuero] = useState('52,00');
  const [cobrando, setCobrando] = useState('61,18');
  // Cupom da própria loja. Nasce zerado: cupom é escolha, não padrão.
  const [cupomTipo, setCupomTipo] = useState('pct'); // 'pct' | 'valor'
  const [cupom, setCupom] = useState('0');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${RESTAURANT_API_URL}/api/restaurant/minha-taxa`, {
          headers: createAuthHeaders(),
        });
        const j = await r.json();
        if (!r.ok || j?.status !== 'success') throw new Error(j?.error || 'falhou');
        setTaxa(j.data);
      } catch {
        // Sem a taxa real a calculadora mentiria. Melhor dizer que não deu.
        setErro('Não consegui carregar a sua taxa agora. Recarregue a página em instantes.');
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  const paraNumero = (s) => {
    const n = parseFloat(String(s).replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const pctEntrega  = taxa ? taxa.taxa_entrega_pct  / 100 : 0;
  const pctRetirada = taxa ? taxa.taxa_retirada_pct / 100 : 0;

  // ⚠️ O CUPOM DA LOJA SAI INTEIRO DO REPASSE DELA, E A COMISSÃO CONTINUA
  // SENDO COBRADA SOBRE O PREÇO CHEIO. No servidor:
  //     repasse = subtotal − comissão − desconto_parceiro
  // e a comissão é calculada sobre o `subtotal` (preço de tabela), não sobre o
  // valor já com desconto. Ou seja: dar 10% de cupom custa 10% do PREÇO, e não
  // 10% do que sobraria. É onde o parceiro se engana e vende no vermelho.
  const calc = useMemo(() => {
    const alvo = paraNumero(quero);
    const cob  = paraNumero(cobrando);
    const c    = paraNumero(cupom);
    const pctCupom = cupomTipo === 'pct' ? Math.min(c, 100) / 100 : 0;
    const valCupom = cupomTipo === 'valor' ? c : 0;

    // Pra receber `alvo` mesmo dando cupom:
    //   X − X·taxa − X·cupom% − cupomR$ = alvo   →   X = (alvo + cupomR$) / (1 − taxa − cupom%)
    const preco = (p) => {
      const div = 1 - p - pctCupom;
      return div > 0.02 ? (alvo + valCupom) / div : 0;
    };
    const sobra = (p) => cob - cob * p - cob * pctCupom - valCupom;

    return {
      alvo,
      temCupom: pctCupom > 0 || valCupom > 0,
      // Margem impossível: taxa + cupom comendo tudo. Preço explodiria.
      inviavel: 1 - pctEntrega - pctCupom <= 0.02,
      precoEntrega:  preco(pctEntrega),
      precoRetirada: preco(pctRetirada),
      recebeEntrega:  sobra(pctEntrega),
      recebeRetirada: sobra(pctRetirada),
      // Quanto o cupom custa de verdade, em reais, no preço sugerido.
      custoCupom: pctCupom > 0 ? preco(pctEntrega) * pctCupom : valCupom,
      somandoErrado: alvo * (1 + pctEntrega) * (1 - pctEntrega),
    };
  }, [quero, cobrando, cupom, cupomTipo, pctEntrega, pctRetirada]);

  if (carregando) {
    return (
      <div className="p-6 flex items-center gap-2 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Carregando a sua taxa…
      </div>
    );
  }

  if (erro) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {erro}
        </div>
      </div>
    );
  }

  const Campo = ({ label, valor, onChange, dica }) => (
    <label className="block">
      <span className="block text-sm font-semibold text-gray-700 mb-1">{label}</span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
        <input
          type="text" inputMode="decimal" value={valor}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-3 py-3 text-lg font-bold border-2 border-gray-200 rounded-xl
                     focus:border-orange-400 focus:outline-none"
        />
      </div>
      {dica && <span className="block text-xs text-gray-400 mt-1">{dica}</span>}
    </label>
  );

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Como formar o seu preço</h1>
        <p className="text-gray-500 mt-1">
          Quanto colocar em cima para não vender no prejuízo.
        </p>
      </div>

      {/* A taxa REAL desta loja */}
      <div className="rounded-2xl bg-gray-900 text-white p-5">
        <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
          A sua taxa hoje
        </p>
        <div className="flex flex-wrap gap-6 mt-3">
          <div>
            <p className="text-3xl font-black text-orange-400">{taxa.taxa_entrega_pct}%</p>
            <p className="text-sm text-gray-300">nos pedidos com entrega</p>
          </div>
          {taxa.aceita_retirada && (
            <div>
              <p className="text-3xl font-black text-green-400">{taxa.taxa_retirada_pct}%</p>
              <p className="text-sm text-gray-300">nos pedidos de retirada</p>
            </div>
          )}
        </div>
        {taxa.fundador && (
          <p className="text-xs text-gray-400 mt-3">
            Você é <strong className="text-orange-300">Parceiro Fundador</strong>: paga metade
            da taxa cheia ({taxa.taxa_base_pct}%)
            {taxa.fundador_ate
              ? ` até ${new Date(taxa.fundador_ate).toLocaleDateString('pt-BR')}.`
              : '.'}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-2">
          A taxa incide só sobre os <strong>produtos</strong>. O frete não entra nessa conta.
        </p>
      </div>

      {/* O erro que quase todo mundo comete */}
      <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div className="text-sm text-red-900 space-y-2">
            <p className="font-bold text-base">
              Somar a taxa não devolve o valor. Tem que dividir.
            </p>
            <p>
              Se você quer receber <strong>{brl(calc.alvo)}</strong> e apenas somar
              os {taxa.taxa_entrega_pct}%, você vai receber{' '}
              <strong>{brl(calc.somandoErrado)}</strong> — e não{' '}
              {brl(calc.alvo)}. A diferença sai do seu bolso, em todo pedido.
            </p>
            <p>
              O motivo: a taxa é cobrada sobre o preço <em>final</em>, que já é maior.
              Por isso a conta certa é <strong>dividir</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Calculadora: quanto cobrar */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold text-gray-800">Quanto devo cobrar no app?</h2>
        </div>

        <Campo
          label="Quero receber, limpo, por este produto:"
          valor={quero} onChange={setQuero}
          dica="O mesmo valor que você ganha vendendo no balcão."
        />

        {/* Cupom: entra na MESMA conta, porque sai do mesmo bolso. */}
        <div className="mt-4">
          <span className="block text-sm font-semibold text-gray-700 mb-1">
            Vou dar cupom neste produto?
          </span>
          <div className="flex gap-2">
            <div className="flex rounded-xl border-2 border-gray-200 overflow-hidden">
              {[['pct', '%'], ['valor', 'R$']].map(([k, rot]) => (
                <button
                  key={k} type="button" onClick={() => setCupomTipo(k)}
                  className={`px-4 py-3 text-sm font-bold transition-colors ${
                    cupomTipo === k ? 'bg-orange-500 text-white' : 'bg-white text-gray-500'}`}
                >{rot}</button>
              ))}
            </div>
            <input
              type="text" inputMode="decimal" value={cupom}
              onChange={(e) => setCupom(e.target.value)}
              className="flex-1 px-3 py-3 text-lg font-bold border-2 border-gray-200 rounded-xl
                         focus:border-orange-400 focus:outline-none"
            />
          </div>
          <span className="block text-xs text-gray-400 mt-1">
            Deixe 0 se não for dar desconto.
          </span>
        </div>

        {calc.temCupom && !calc.inviavel && (
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
            <p className="font-bold">O cupom sai inteiro do seu bolso.</p>
            <p className="mt-1">
              A comissão de {taxa.taxa_entrega_pct}% continua sendo cobrada sobre o
              preço <strong>cheio</strong>, não sobre o preço com desconto. Neste
              exemplo o cupom custa <strong>{brl(calc.custoCupom)}</strong> por pedido —
              já embutido no valor sugerido abaixo.
            </p>
          </div>
        )}

        {calc.inviavel && (
          <div className="mt-4 rounded-xl bg-red-100 border-2 border-red-300 p-4 text-sm text-red-900">
            <p className="font-bold">Esse cupom não fecha a conta.</p>
            <p className="mt-1">
              Taxa ({taxa.taxa_entrega_pct}%) mais cupom consomem quase tudo que entra.
              Para receber {brl(calc.alvo)} você teria que cobrar um valor absurdo.
              Diminua o desconto.
            </p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3 mt-5">
          <div className="rounded-xl bg-orange-50 border border-orange-200 p-4">
            <p className="text-xs font-semibold text-orange-700 uppercase">Coloque no cardápio</p>
            <p className="text-3xl font-black text-orange-600 mt-1">{brl(calc.precoEntrega)}</p>
            <p className="text-xs text-orange-800 mt-1">
              pedidos com entrega · taxa de {taxa.taxa_entrega_pct}%
              {calc.temCupom && ' · já com o cupom'}
            </p>
          </div>
          {taxa.aceita_retirada && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4">
              <p className="text-xs font-semibold text-green-700 uppercase">Se fosse só retirada</p>
              <p className="text-3xl font-black text-green-700 mt-1">{brl(calc.precoRetirada)}</p>
              <p className="text-xs text-green-800 mt-1">
                taxa de {taxa.taxa_retirada_pct}% · você cobraria menos
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-4">
          ⚠️ O cardápio tem um preço só, usado nos dois casos. Se você atende os dois,
          use o valor da entrega — na retirada você recebe um pouco mais, e não menos.
        </p>
      </div>

      {/* Caminho inverso */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-bold text-gray-800">Já tenho um preço. Quanto sobra?</h2>
        </div>
        <Campo
          label="Preço que está no meu cardápio:"
          valor={cobrando} onChange={setCobrando}
          dica={calc.temCupom
            ? 'O cupom que você colocou acima já está descontado no resultado.'
            : undefined}
        />
        <div className="grid sm:grid-cols-2 gap-3 mt-5">
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-600 uppercase">Você recebe (entrega)</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{brl(calc.recebeEntrega)}</p>
          </div>
          {taxa.aceita_retirada && (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase">Você recebe (retirada)</p>
              <p className="text-2xl font-black text-gray-800 mt-1">{brl(calc.recebeRetirada)}</p>
            </div>
          )}
        </div>
      </div>

      {/* O que a conta NÃO inclui — omitir isso seria a mesma armadilha */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-sm text-gray-600 space-y-2">
        <h2 className="text-base font-bold text-gray-800">Três coisas que mudam essa conta</h2>
        <p>
          <strong className="text-gray-800">Cupom seu.</strong> O desconto sai do{' '}
          <em>seu</em> repasse, e a taxa continua sendo cobrada sobre o preço cheio —
          por isso ele entra na calculadora acima, no campo de cupom. Cupom da Inksa
          (quando a gente faz campanha) é por nossa conta e não mexe no seu repasse.
        </p>
        <p>
          <strong className="text-gray-800">Frete.</strong> Não entra na taxa. Em entrega
          própria, o frete é 100% seu.
        </p>
        <p>
          <strong className="text-gray-800">Seu custo.</strong> Esta conta protege a sua
          margem atual — ela não sabe quanto custa produzir. Se hoje você já vende no
          limite, o app não vai consertar isso.
        </p>
      </div>
    </div>
  );
}
