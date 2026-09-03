// src/components/CredenciaisApi.jsx
//
// AS CHAVES QUE O PDV DA LOJA USA PARA FALAR COM A INKSA.
//
// Fica dentro da aba Integração, ABAIXO do formulário de contato, e não no
// lugar dele: a maioria dos parceiros não sabe o que é um token e precisa da
// conversa. Quem já tem um técnico do PDV do lado pega a chave e vai embora.
//
// O token aparece UMA vez, na resposta da criação. Não existe "ver de novo" —
// o servidor guarda só o hash. Por isso a tela grita isso na hora, em vez de
// deixar a pessoa fechar o aviso e descobrir depois.
import { useEffect, useState } from 'react';
import { KeyRound, Copy, Check, Trash2, Loader2, AlertTriangle, Plus } from 'lucide-react';
import { RESTAURANT_API_URL, createAuthHeaders } from '../services/api';
import { apiFetch } from '../services/apiClient';

const BASE = `${RESTAURANT_API_URL}/api/parceiro/credenciais`;
const DOCS = 'https://www.inksadelivery.com.br/api';

export default function CredenciaisApi() {
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState(null);
  const [criando, setCriando] = useState(false);
  const [nova, setNova] = useState(null);      // token em texto, só desta vez
  const [copiado, setCopiado] = useState(false);
  const [nome, setNome] = useState('');

  const carregar = async () => {
    try {
      const r = await apiFetch(BASE, { headers: createAuthHeaders() });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.mensagem || 'Não foi possível carregar.');
      setLista(d.credenciais || []);
    } catch (e) {
      setErro(e.message);
      setLista([]);
    }
  };

  useEffect(() => { carregar(); }, []);

  const criar = async () => {
    setCriando(true);
    setErro(null);
    try {
      const r = await apiFetch(BASE, {
        method: 'POST',
        headers: { ...createAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim() || 'Integração' }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.mensagem || 'Não foi possível criar.');
      setNova(d.token);
      setNome('');
      carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setCriando(false);
    }
  };

  const revogar = async (id, prefixo) => {
    // Revogar derruba a integração na hora. Confirmar aqui evita a loja
    // parar de receber pedido no sistema dela por um clique errado.
    if (!window.confirm(
      `Revogar a credencial ${prefixo}?\n\n` +
      'O sistema que usa esta chave para de receber pedidos imediatamente. ' +
      'Não dá para desfazer — seria preciso gerar outra e reconfigurar.'
    )) return;

    try {
      const r = await apiFetch(`${BASE}/${id}`, { method: 'DELETE', headers: createAuthHeaders() });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.mensagem || 'Não foi possível revogar.');
      }
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  };

  const copiar = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt('Copie a chave:', texto);
    }
  };

  const quando = (iso) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—');

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-gray-100 p-2 shrink-0">
          <KeyRound className="h-5 w-5 text-gray-700" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-gray-900">Chaves de acesso</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Para quem já tem um técnico configurando o sistema. Entregue a chave a
            ele junto com o endereço da documentação:{' '}
            {/* break-words e nao break-all: com break-all a URL partia no meio
                da palavra ("...com.b / r/api") e ficava ilegivel na tela do
                celular. E mostra sem o www, que e mais curto e funciona igual. */}
            <a href={DOCS} target="_blank" rel="noreferrer"
               className="text-orange-600 font-medium hover:underline break-words">
              inksadelivery.com.br/api
            </a>
          </p>
        </div>
      </div>

      {/* O token só existe aqui, uma vez. Bloco de alerta e não um "copiado!"
          discreto: se a pessoa fechar sem copiar, a chave se perde. */}
      {nova && (
        <div className="mt-4 rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-amber-900">Copie agora — ela não aparece de novo</p>
              <p className="text-sm text-amber-800 mt-0.5">
                Guardamos só uma marca da chave, nunca a chave. Se perder, é só gerar outra.
              </p>
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <code className="flex-1 min-w-0 break-all rounded bg-white border border-amber-300 px-3 py-2 text-xs font-mono text-gray-900">
                  {nova}
                </code>
                <button
                  type="button"
                  onClick={() => copiar(nova)}
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 min-h-[40px]"
                >
                  {copiado ? <><Check className="h-4 w-4" /> Copiado</> : <><Copy className="h-4 w-4" /> Copiar</>}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setNova(null)}
                className="mt-3 text-sm font-semibold text-amber-900 hover:underline"
              >
                Já guardei, pode fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={60}
          placeholder="Para que é esta chave? Ex: Suitable"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={criar}
          disabled={criando}
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60 min-h-[40px]"
        >
          {criando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Gerar chave
        </button>
      </div>

      {erro && (
        <p className="mt-3 text-sm text-red-600">{erro}</p>
      )}

      {lista === null ? (
        <p className="mt-4 text-sm text-gray-400">Carregando…</p>
      ) : lista.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          Nenhuma chave ainda. Você só precisa de uma quando for ligar o Inksa a
          outro sistema.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-gray-100">
          {lista.map((c) => (
            <li key={c.id} className="py-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${c.revogada ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                  {c.nome}
                </p>
                <p className="text-xs text-gray-500 font-mono break-all">{c.prefixo}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Criada em {quando(c.criado_em)}
                  {/* "Último uso" é o que responde a pergunta de suporte mais
                      comum: "o sistema parou de puxar pedido desde quando?" */}
                  {' · '}
                  {c.ultimo_uso_em ? `usada em ${quando(c.ultimo_uso_em)}` : 'nunca usada'}
                </p>
              </div>
              {c.revogada ? (
                <span className="shrink-0 text-xs text-gray-400">Revogada</span>
              ) : (
                <button
                  type="button"
                  onClick={() => revogar(c.id, c.prefixo)}
                  aria-label={`Revogar a chave ${c.nome}`}
                  className="shrink-0 rounded-lg p-2 text-gray-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
