// Opções do item: "escolha o corte", "escolha o molho", "adicionais".
//
// Pedido da Yo!Frango (24/08/2026): quem vende frango precisa perguntar o
// corte. Antes, a única saída era cadastrar um item por variação — cardápio de
// 12 linhas pra 3 pratos.
//
// A tela é deliberadamente burra: monta a lista inteira e manda de uma vez,
// substituindo o que havia. Edição peça por peça exigiria orquestrar criação e
// remoção em ordem, e o risco é o cardápio ficar meio salvo — metade das
// opções no ar, metade não, no meio do almoço.
//
// Vocabulário: nada de "min/max". O parceiro escolhe entre "escolher uma"
// (obrigatório) e "adicionais" (opcional, vários). São os dois casos reais, e
// os números certos saem disso sem ninguém precisar entender a regra.
import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, Loader2, GripVertical, ImagePlus } from 'lucide-react';
import { RESTAURANT_API_URL, createAuthHeaders } from '../services/api';
import { useToast } from '../context/ToastContext.jsx';

const grupoVazio = () => ({
  nome: '', tipo: 'uma', limite: '',
  opcoes: [{ nome: '', preco_extra: '', imagem_url: '' }],
});

/**
 * Sobe a foto da opção reusando o upload que já serve os itens do cardápio.
 *
 * Foto na opção vende: em adicional de açaí, morango e banana se escolhem pelo
 * olho, não pela leitura. Continua OPCIONAL — quem vende "P, M, G" não tem
 * foto de tamanho pra pôr, e obrigar imagem faria o parceiro desistir do
 * recurso na primeira tela.
 */
async function subirFoto(arquivo) {
  const fd = new FormData();
  fd.append('file', arquivo);
  const r = await fetch(`${RESTAURANT_API_URL}/api/menu/upload-image`, {
    method: 'POST', headers: createAuthHeaders(), body: fd,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || 'Não consegui subir a imagem.');
  // O endpoint devolve { data: { image_url } }; os outros formatos são rede de
  // segurança caso a resposta mude.
  return j.data?.image_url || j.image_url || j.url || '';
}

export default function OpcoesDoItem({ item, onFechar }) {
  const { addToast } = useToast();
  const [grupos, setGrupos] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch(`${RESTAURANT_API_URL}/api/menu/items/${item.id}/opcoes`, { headers: createAuthHeaders() })
      .then((r) => (r.ok ? r.json() : { grupos: [] }))
      .then((d) => setGrupos((d.grupos || []).map((g) => ({
        nome: g.nome,
        tipo: g.min_escolhas > 0 && g.max_escolhas === 1 ? 'uma' : 'adicionais',
        // Limite só aparece preenchido se for menor que o total — "até 3 de 8"
        // é regra; "até 8 de 8" é o mesmo que sem limite.
        limite: g.max_escolhas < (g.opcoes || []).length ? String(g.max_escolhas) : '',
        opcoes: (g.opcoes || []).map((o) => ({
          nome: o.nome,
          preco_extra: Number(o.preco_extra) ? String(Number(o.preco_extra).toFixed(2)) : '',
          imagem_url: o.imagem_url || '',
        })),
      }))))
      .catch(() => setGrupos([]));
  }, [item.id]);

  const mexer = (i, mud) => setGrupos((g) => g.map((x, k) => (k === i ? { ...x, ...mud } : x)));
  const mexerOpcao = (i, j, mud) => setGrupos((g) => g.map((x, k) => (
    k === i ? { ...x, opcoes: x.opcoes.map((o, l) => (l === j ? { ...o, ...mud } : o)) } : x
  )));

  const salvar = async () => {
    setSalvando(true);
    try {
      const corpo = {
        grupos: (grupos || [])
          .filter((g) => g.nome.trim() && g.opcoes.some((o) => o.nome.trim()))
          .map((g) => {
            const opcoes = g.opcoes.filter((o) => o.nome.trim());
            // Limite dos adicionais: é o "escolha até 3 acompanhamentos" da
            // açaiteria. Em branco = pode marcar todos. O servidor corta pelo
            // número de opções, então valor maior que isso não vira problema.
            const lim = parseInt(g.limite, 10);
            const teto = Number.isFinite(lim) && lim > 0
              ? Math.min(lim, opcoes.length)
              : opcoes.length;
            return {
              nome: g.nome.trim(),
              // "Escolher uma" = obrigatório e só uma. "Adicionais" = opcional,
              // até o teto definido (ou todos).
              min_escolhas: g.tipo === 'uma' ? 1 : 0,
              max_escolhas: g.tipo === 'uma' ? 1 : teto,
              opcoes: opcoes.map((o) => ({
                nome: o.nome.trim(),
                preco_extra: Number(String(o.preco_extra).replace(',', '.')) || 0,
                disponivel: true,
                imagem_url: (o.imagem_url || '').trim() || null,
              })),
            };
          }),
      };
      const r = await fetch(`${RESTAURANT_API_URL}/api/menu/items/${item.id}/opcoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...createAuthHeaders() },
        body: JSON.stringify(corpo),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error || 'Não consegui salvar.');
      addToast('success', 'Opções salvas.');
      onFechar();
    } catch (e) {
      addToast('error', e.message || 'Não consegui salvar.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/60 p-4">
      <div className="my-6 w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Opções de {item.name}</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              Tamanho, sabor, adicionais &mdash; o que o cliente escolhe na hora de
              pedir. A escolha sai impressa na comanda.
            </p>
          </div>
          <button onClick={onFechar} className="rounded p-1 text-gray-400 hover:bg-gray-100"
                  aria-label="Fechar"><X size={20} /></button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {grupos === null && (
            <p className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
            </p>
          )}

          {grupos?.map((g, i) => (
            <div key={i} className="mb-4 rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <GripVertical size={16} className="shrink-0 text-gray-300" />
                <input
                  value={g.nome}
                  onChange={(e) => mexer(i, { nome: e.target.value })}
                  placeholder="Nome do grupo (ex.: Tamanho, Sabor, Adicionais)"
                  className="min-h-[40px] flex-1 min-w-[12rem] rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-orange-500"
                />
                <select
                  value={g.tipo}
                  onChange={(e) => mexer(i, { tipo: e.target.value })}
                  className="min-h-[40px] rounded-lg border border-gray-300 px-2 text-sm"
                >
                  <option value="uma">Escolher uma (obrigatório)</option>
                  <option value="adicionais">Adicionais (opcional)</option>
                </select>
                {g.tipo === 'adicionais' && (
                  <label className="flex items-center gap-1 text-xs text-gray-500">
                    até
                    <input
                      value={g.limite}
                      onChange={(e) => mexer(i, { limite: e.target.value.replace(/\D/g, '') })}
                      placeholder="todos"
                      inputMode="numeric"
                      title="Quantos o cliente pode marcar. Em branco, pode marcar todos."
                      className="min-h-[40px] w-16 rounded-lg border border-gray-300 px-2 text-center text-sm outline-none focus:border-orange-500"
                    />
                  </label>
                )}
                <button
                  onClick={() => setGrupos((gs) => gs.filter((_, k) => k !== i))}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Remover grupo"
                ><Trash2 size={16} /></button>
              </div>

              <div className="mt-3 space-y-2 pl-6">
                {g.opcoes.map((o, j) => (
                  <div key={j} className="flex items-center gap-2">
                    {/* Foto opcional. Um quadradinho clicável em vez de campo
                        de arquivo: ocupa o espaço de um ícone e já mostra o
                        que subiu, sem precisar de linha extra por opção. */}
                    <label
                      title="Foto da opção (opcional)"
                      className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 hover:border-orange-400"
                    >
                      {o.imagem_url
                        ? <img src={o.imagem_url} alt="" className="h-full w-full object-cover" />
                        : <ImagePlus size={15} className="absolute inset-0 m-auto text-gray-400" />}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const arq = e.target.files?.[0];
                          if (!arq) return;
                          try {
                            const url = await subirFoto(arq);
                            mexerOpcao(i, j, { imagem_url: url });
                          } catch (err) {
                            addToast('error', err.message || 'Não consegui subir a imagem.');
                          } finally {
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                    <input
                      value={o.nome}
                      onChange={(e) => mexerOpcao(i, j, { nome: e.target.value })}
                      placeholder="Opção (ex.: Pequeno, Morango)"
                      className="min-h-[38px] flex-1 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-orange-500"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">+R$</span>
                      <input
                        value={o.preco_extra}
                        onChange={(e) => mexerOpcao(i, j, { preco_extra: e.target.value })}
                        placeholder="0,00"
                        inputMode="decimal"
                        className="min-h-[38px] w-20 rounded-lg border border-gray-300 px-2 text-sm outline-none focus:border-orange-500"
                      />
                    </div>
                    <button
                      onClick={() => mexer(i, { opcoes: g.opcoes.filter((_, l) => l !== j) })}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remover opção"
                    ><Trash2 size={14} /></button>
                  </div>
                ))}
                <button
                  onClick={() => mexer(i, { opcoes: [...g.opcoes, { nome: '', preco_extra: '', imagem_url: '' }] })}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:underline"
                ><Plus size={14} /> opção</button>
              </div>
            </div>
          ))}

          {grupos && (
            <button
              onClick={() => setGrupos([...(grupos || []), grupoVazio()])}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-orange-300 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
            ><Plus size={15} /> Adicionar grupo</button>
          )}

          {grupos?.length === 0 && (
            <p className="mt-3 text-sm text-gray-500">
              Sem opções, o cliente adiciona o item direto — que é o certo pra
              quem não precisa perguntar nada.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 p-4">
          <button onClick={onFechar} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
          <button
            onClick={salvar}
            disabled={salvando || grupos === null}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-orange-600 px-5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar opções
          </button>
        </div>
      </div>
    </div>
  );
}
