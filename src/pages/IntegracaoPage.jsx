import React, { useState } from 'react';
import { Plug, Loader2, CheckCircle2, AlertCircle, Send, KeyRound, MessageCircle, ExternalLink, Copy, Check } from 'lucide-react';
import { RESTAURANT_API_URL } from '../services/api';
import { apiFetch } from '../services/apiClient';
import { authService } from '../services/authService';
import CredenciaisApi from '../components/CredenciaisApi';
import { mensagemDeErro } from '../utils/mensagemDeErro.js';

const DOCS = 'https://www.inksadelivery.com.br/api';

// O RECADO QUE O PARCEIRO MANDA PRO FORNECEDOR.
//
// Escrito pra ser lido por um TÉCNICO, não pelo lojista: diz o modelo (quem
// pergunta é o sistema dele), diz o que já vem pronto e diz onde está o
// contrato. Sem isso o parceiro encaminhava "quero integrar com a Inksa" e o
// fornecedor voltava com as mesmas cinco perguntas — que é como nasce um
// chamado que não precisava existir.
const RECADO = `Oi! A gente vende pela Inksa Delivery e quero ligar os pedidos no nosso sistema.

A documentação da API está em ${DOCS}

O modelo é o mesmo dos outros apps de delivery: o NOSSO sistema pergunta se tem pedido novo, a Inksa não empurra nada. Não precisa de IP fixo, porta aberta nem webhook do nosso lado.

Já vem pronto: receber os pedidos, mudar o status (aceitar, preparar, pronto) e manter o cardápio e os preços sincronizados.

Te mando a chave de acesso em seguida — ela aparece uma vez só, então guarde.

Se travar em alguma coisa que a documentação não responde, me avisa que eu abro um chamado direto com eles.`;

/**
 * Integração com o sistema da loja.
 *
 * O QUE ESTA PÁGINA É (mudou em 24/09/2026): uma tela de AUTOATENDIMENTO. O
 * parceiro gera a chave, copia um recado pronto e manda pro fornecedor do
 * sistema dele. Acabou ali — a API é pública e o fabricante não precisa de
 * autorização nossa pra começar.
 *
 * ⚠️ ELA ERA UM FORMULÁRIO DE CONTATO, e isso custava chamado à toa. O texto
 * dizia que a Inksa "entra na conversa junto com você" e que "a gente fala
 * com o fornecedor por você" — duas frases escritas quando a Inksa ainda não
 * tinha API nenhuma e integração era mesmo caso a caso. Hoje a API existe,
 * está documentada e é aberta, mas a tela continuava pedindo licença.
 *
 * O primeiro chamado de integração que a Inksa recebeu (24/09/2026) provou o
 * custo: cinco perguntas, quatro delas respondidas na página pública. O
 * parceiro não abriu chamado por falta de recurso — abriu porque a tela
 * sugeria que era assim que se começa.
 *
 * O QUE ELA NÃO PODE SER: uma promessa de conector. Quem escreve a ligação é
 * o fabricante do sistema dele, e isso continua dito em voz alta.
 *
 * O CHAMADO CONTINUA, com outro papel: dúvida TÉCNICA que a documentação não
 * responde. Vai pro mesmo sistema de tickets do Suporte de propósito — o
 * Diego já lê aquela caixa todo dia, e um canal novo que ninguém abre é pior
 * que nenhum.
 */

const SISTEMAS = [
  'Não uso nenhum sistema (anoto no papel/WhatsApp)',
  'Consumer',
  'Saipos',
  'Suitable',
  'Colibri / Bemacash',
  'Linear',
  'Teknisa',
  'Goomer',
  'ConnectPlug / CPlug',
  'Simpliza',
  'SisFood',
  'Sischef',
  'Outro (escrevo abaixo)',
];

const INTERESSES = [
  { id: 'pedidos', label: 'Receber os pedidos do Inksa direto no meu sistema' },
  { id: 'cardapio', label: 'Manter o cardápio e os preços sincronizados' },
  { id: 'status', label: 'Meu sistema avisar o Inksa quando o pedido fica pronto' },
  { id: 'impressao', label: 'Imprimir o pedido automático na cozinha' },
  { id: 'financeiro', label: 'Exportar as vendas para o meu financeiro/contador' },
];

function headers() {
  const token = authService?.getToken?.() || localStorage.getItem('restaurantAuthToken');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export default function IntegracaoPage() {
  const [form, setForm] = useState({
    sistema: '',
    sistemaOutro: '',
    contatoFornecedor: '',
    pedidosDia: '',
    contato: '',
    observacoes: '',
  });
  const [interesses, setInteresses] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [enviado, setEnviado] = useState(false);
  const [recadoCopiado, setRecadoCopiado] = useState(false);

  const copiarRecado = async () => {
    try {
      await navigator.clipboard.writeText(RECADO);
      setRecadoCopiado(true);
      setTimeout(() => setRecadoCopiado(false), 2500);
    } catch {
      // Sem permissão de área de transferência o texto continua na tela e
      // dá pra selecionar na mão — por isso aqui não vira erro na cara.
    }
  };

  // Rolagem suave, respeitando quem pediu menos animação no sistema.
  const irPara = (id) => {
    const alvo = document.getElementById(id);
    if (!alvo) return;
    const reduzir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    alvo.scrollIntoView({ behavior: reduzir ? 'auto' : 'smooth', block: 'start' });
  };

  const alternarInteresse = (id) =>
    setInteresses((atual) => (atual.includes(id) ? atual.filter((i) => i !== id) : [...atual, id]));

  const enviar = async (e) => {
    e.preventDefault();
    if (!form.sistema) {
      setErro('Diga qual sistema você usa hoje — é a informação que define tudo o resto.');
      return;
    }
    if (!form.contato.trim()) {
      setErro('Deixe um telefone ou e-mail para retorno.');
      return;
    }

    const sistema = form.sistema.startsWith('Outro') && form.sistemaOutro.trim()
      ? form.sistemaOutro.trim()
      : form.sistema;

    const escolhidos = INTERESSES.filter((i) => interesses.includes(i.id)).map((i) => `- ${i.label}`);

    const descricao = [
      `Sistema usado hoje: ${sistema}`,
      form.contatoFornecedor.trim() && `Contato do fornecedor do sistema: ${form.contatoFornecedor.trim()}`,
      form.pedidosDia.trim() && `Pedidos por dia (aprox.): ${form.pedidosDia.trim()}`,
      `Melhor contato: ${form.contato.trim()}`,
      '',
      escolhidos.length ? `O que quer integrar:\n${escolhidos.join('\n')}` : 'Não marcou itens específicos.',
      form.observacoes.trim() && `\nObservações:\n${form.observacoes.trim()}`,
    ].filter(Boolean).join('\n');

    setEnviando(true);
    setErro(null);
    try {
      const res = await apiFetch(`${RESTAURANT_API_URL}/api/support/tickets`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          subject: `Integração — ${sistema}`,
          description: descricao,
          category: 'Integração',
          priority: 'Médio',
        }),
      });
      const data = await res.json();
      // A resposta MANDA na mensagem: nada de "enviado!" sem o servidor confirmar.
      if (!res.ok) throw new Error(data?.message || `Não conseguimos enviar (HTTP ${res.status}).`);
      setEnviado(true);
    } catch (e) {
      setErro(mensagemDeErro(e, 'Falha ao enviar. Tente de novo em instantes.'));
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
          <h1 className="text-xl font-bold text-emerald-900 mt-3">Recebemos seu pedido</h1>
          <p className="text-sm text-emerald-800 mt-2">
            Sua mensagem virou um chamado na nossa central e aparece em <strong>Suporte</strong>, onde
            você acompanha a resposta. Vamos avaliar o que dá pra fazer com o seu sistema e falar com você.
          </p>
          <p className="text-xs text-emerald-700 mt-4">
            Se surgir alguma informação nova, responda pelo próprio chamado — assim fica tudo junto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-orange-100 p-2.5 shrink-0">
          <Plug className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Integração</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Ligar o Inksa ao sistema que a sua loja já usa.
          </p>
        </div>
      </div>

      {/* Este texto hedgeava ("cada caso é avaliado separadamente") porque foi
          escrito quando a Inksa não tinha API nenhuma. Hoje tem, pública e
          documentada — e continuar hedgeando faria o parceiro entender "não
          dá". A parte honesta que PERMANECE: quem escreve o conector é o
          fabricante do sistema dele, não a gente. */}
      {/* ⚠️ ESTE TEXTO JÁ PEDIU AUTORIZAÇÃO QUANDO NÃO PRECISAVA.
          Ele dizia que a Inksa "entra na conversa com eles junto com você", e
          o cartão de baixo prometia "a gente fala com o fornecedor por você".
          Nas duas frases o parceiro entendia que precisava da gente pra
          começar — e abria chamado pra perguntar coisa que a documentação
          responde. Foi o que aconteceu no primeiro chamado de integração que
          a Inksa recebeu (24/09/2026): cinco perguntas, quatro respondidas na
          página pública.
          A API é ABERTA: o parceiro gera a chave e entrega. A gente só entra
          quando o fornecedor tiver uma dúvida técnica de verdade. */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <p className="font-semibold">Dá para integrar, e você não precisa nos pedir nada</p>
        <p className="mt-1">
          A Inksa tem uma <strong>API pública e documentada</strong>. Qualquer sistema de gestão
          que acesse a internet consegue receber os seus pedidos direto, mudar o status e manter
          o cardápio em dia — sem ninguém digitar duas vezes.
        </p>
        <p className="mt-2">
          São <strong>dois passos</strong>: você gera a chave aqui embaixo e manda, junto com o
          link da documentação, para quem cuida do seu sistema. Quem escreve a ligação entre os
          dois lados é o fabricante dele — e ele não precisa de autorização nossa para começar.
        </p>
        <a
          href={DOCS}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 font-semibold text-emerald-800 hover:underline"
        >
          Ver a documentação técnica
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>

      {/* O RECADO PRONTO É A PEÇA QUE FALTAVA.
          A tela mandava o parceiro "entregar a chave e a documentação ao
          técnico" — e não dava o texto. Sem ele, quem não sabe explicar o que
          está pedindo abre um chamado pra que a gente explique. Com ele, o
          caminho inteiro é copiar e colar no WhatsApp do fornecedor. */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="flex items-center gap-2 font-bold text-gray-900">
          <MessageCircle className="h-4 w-4 text-orange-600" aria-hidden="true" />
          Mande isto para quem cuida do seu sistema
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Copie, cole no WhatsApp dele e anexe a chave que você gerar abaixo.
        </p>
        <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700 font-sans">{RECADO}</pre>
        <button
          type="button"
          onClick={copiarRecado}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 min-h-[44px]"
        >
          {recadoCopiado
            ? <><Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Copiado</>
            : <><Copy className="h-4 w-4" aria-hidden="true" /> Copiar recado</>}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => irPara('chaves')}
          className="text-left rounded-xl border border-gray-200 bg-white p-4 hover:border-orange-300 hover:bg-orange-50/40"
        >
          <span className="flex items-center gap-2 font-semibold text-gray-900">
            <KeyRound className="h-4 w-4 text-orange-600" aria-hidden="true" />
            Gerar a chave de acesso
          </span>
          <span className="block text-sm text-gray-500 mt-1">
            Aparece uma vez só. Copie e entregue junto com o recado acima.
          </span>
        </button>

        {/* O chamado deixou de ser "não sei por onde começar" e virou o que
            ele realmente serve: dúvida TÉCNICA que a documentação não cobre.
            Quem responde isso é a Inksa; o resto o parceiro resolve sozinho. */}
        <button
          type="button"
          onClick={() => irPara('ajuda')}
          className="text-left rounded-xl border border-gray-200 bg-white p-4 hover:border-orange-300 hover:bg-orange-50/40"
        >
          <span className="flex items-center gap-2 font-semibold text-gray-900">
            <MessageCircle className="h-4 w-4 text-orange-600" aria-hidden="true" />
            O fornecedor ficou com dúvida
          </span>
          <span className="block text-sm text-gray-500 mt-1">
            Só se ele travar em algo que a documentação não responde. A gente fala com ele.
          </span>
        </button>
      </div>

      <div id="chaves">
        <CredenciaisApi />
      </div>

      <div id="ajuda">
        <h2 className="font-bold text-gray-900">Seu fornecedor travou em alguma coisa?</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Preencha só se ele tiver uma dúvida que a documentação não responde. A gente fala
          direto com ele. Para começar a integração você <strong>não precisa</strong> deste
          formulário — basta a chave e o recado lá de cima.
        </p>
      </div>

      <form onSubmit={enviar} className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Qual sistema você usa hoje? <span className="text-red-500">*</span>
          </label>
          <select
            value={form.sistema}
            onChange={(e) => setForm((p) => ({ ...p, sistema: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1"
          >
            <option value="">Selecione…</option>
            {SISTEMAS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {form.sistema.startsWith('Outro') && (
            <input
              value={form.sistemaOutro}
              onChange={(e) => setForm((p) => ({ ...p, sistemaOutro: e.target.value }))}
              placeholder="Nome do sistema"
              maxLength={80}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-2"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Contato de quem cuida do seu sistema
          </label>
          <input
            value={form.contatoFornecedor}
            onChange={(e) => setForm((p) => ({ ...p, contatoFornecedor: e.target.value }))}
            placeholder="Nome, telefone ou e-mail do suporte do sistema"
            maxLength={120}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Quase sempre a conversa técnica é com eles. Ter esse contato adianta semanas.
          </p>
        </div>

        <div>
          <span className="block text-sm font-medium text-gray-700">O que você quer resolver?</span>
          <div className="mt-2 space-y-2">
            {INTERESSES.map((i) => (
              <label key={i.id} className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={interesses.includes(i.id)}
                  onChange={() => alternarInteresse(i.id)}
                  className="mt-0.5 accent-orange-500"
                />
                <span>{i.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Pedidos por dia (aprox.)</label>
            <input
              value={form.pedidosDia}
              onChange={(e) => setForm((p) => ({ ...p, pedidosDia: e.target.value }))}
              placeholder="Ex: 30"
              maxLength={20}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Seu contato <span className="text-red-500">*</span>
            </label>
            <input
              value={form.contato}
              onChange={(e) => setForm((p) => ({ ...p, contato: e.target.value }))}
              placeholder="WhatsApp ou e-mail"
              maxLength={120}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Quer contar mais alguma coisa?</label>
          <textarea
            value={form.observacoes}
            onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
            rows={4}
            maxLength={1000}
            placeholder="Ex: tenho duas lojas e queria as duas no mesmo sistema"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1"
          />
        </div>

        {erro && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {enviando ? 'Enviando…' : 'Enviar pedido de integração'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Sua mensagem vira um chamado e você acompanha a resposta em <strong>Suporte</strong>.
        </p>
      </form>
    </div>
  );
}
