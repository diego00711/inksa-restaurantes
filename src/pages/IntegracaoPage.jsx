import React, { useState } from 'react';
import { Plug, Loader2, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { RESTAURANT_API_URL } from '../services/api';
import { apiFetch } from '../services/apiClient';
import { authService } from '../services/authService';

/**
 * Integração com o sistema da loja.
 *
 * O QUE ESTA PÁGINA É: um formulário de contato que abre um ticket com
 * categoria "Integração". Não é um conector — conectar a um PDV exige que o
 * fabricante dele exponha uma API, e isso se combina caso a caso.
 *
 * O QUE ELA NÃO PODE SER: uma promessa. Se a tela sugerir que basta ativar um
 * botão, o parceiro cria expectativa e a frustração vira problema comercial.
 * Por isso o texto diz, em voz alta, que é uma conversa e não uma chave.
 *
 * Vai pro mesmo sistema de tickets do Suporte de propósito: o Diego já lê
 * aquela caixa todo dia, e um canal novo que ninguém abre é pior que nenhum.
 */

const SISTEMAS = [
  'Não uso nenhum sistema (anoto no papel/WhatsApp)',
  'Consumer',
  'Saipos',
  'Colibri / Bemacash',
  'Linear',
  'Teknisa',
  'Goomer',
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
      setErro(e.message || 'Falha ao enviar. Tente de novo em instantes.');
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

      {/* Expectativa honesta ANTES do formulário. Integração depende do
          fabricante do outro sistema, e prometer botão mágico cria frustração
          que custa mais caro que a integração em si. */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-semibold">Como funciona, sem enrolação</p>
        <p className="mt-1">
          Integrar significa que o pedido feito no Inksa cai direto no seu sistema, sem ninguém
          digitar de novo. Para isso, o fabricante do seu sistema precisa permitir essa conexão —
          então cada caso é avaliado separadamente.
        </p>
        <p className="mt-2">
          Preencha abaixo e a gente retorna dizendo o que é possível no seu caso, o que precisamos
          de você e qual o prazo. <strong>Se você ainda não usa sistema nenhum</strong>, responda
          assim mesmo: o app já mostra os pedidos na hora e talvez você nem precise de integração.
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
