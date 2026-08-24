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
import { X, Plus, Trash2, Loader2, GripVertical, ImagePlus, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { RESTAURANT_API_URL, createAuthHeaders } from '../services/api';
import { useToast } from '../context/ToastContext.jsx';

const opcaoVazia = () => ({ nome: '', preco_extra: '', imagem_url: '', disponivel: true });

const grupoVazio = () => ({
  nome: '', tipo: 'uma', limite: '',
  opcoes: [opcaoVazia()],
});

/**
 * Grupos obrigatórios que ficariam sem NENHUMA opção disponível.
 *
 * Isso é uma armadilha silenciosa: o cliente abre o item, o grupo aparece
 * vazio, e o botão de adicionar nunca destrava — porque ele é obrigado a
 * escolher algo que não existe. O item some da loja sem sair do cardápio, e
 * ninguém descobre até alguém reclamar que "não dá pra pedir".
 *
 * Quando acaba TUDO de um grupo obrigatório, o certo é marcar o item inteiro
 * como indisponível no cardápio, não esvaziar a escolha.
 */
function gruposImpossiveis(grupos) {
  return (grupos || [])
    .filter((g) => g.tipo !== 'adicionais' && g.nome.trim())
    .filter((g) => {
      const nomeadas = g.opcoes.filter((o) => o.nome.trim());
      return nomeadas.length > 0 && !nomeadas.some((o) => o.disponivel !== false);
    })
    .map((g) => g.nome.trim());
}

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
        tipo: g.min_escolhas > 0
          ? (g.max_escolhas === 1 ? 'uma' : 'varias')
          : 'adicionais',
        // Limite só aparece preenchido se for menor que o total — "até 3 de 8"
        // é regra; "até 8 de 8" é o mesmo que sem limite.
        limite: g.max_escolhas < (g.opcoes || []).length ? String(g.max_escolhas) : '',
        opcoes: (g.opcoes || []).map((o) => ({
          nome: o.nome,
          preco_extra: Number(o.preco_extra) ? String(Number(o.preco_extra).toFixed(2)) : '',
          imagem_url: o.imagem_url || '',
          // !== false e não Boolean(): opção antiga, gravada antes deste campo
          // existir na tela, tem que abrir como disponível — nunca em falta.
          disponivel: o.disponivel !== false,
        })),
      }))))
      .catch(() => setGrupos([]));
  }, [item.id]);

  const mexer = (i, mud) => setGrupos((g) => g.map((x, k) => (k === i ? { ...x, ...mud } : x)));
  const mexerOpcao = (i, j, mud) => setGrupos((g) => g.map((x, k) => (
    k === i ? { ...x, opcoes: x.opcoes.map((o, l) => (l === j ? { ...o, ...mud } : o)) } : x
  )));

  const salvar = async () => {
    // Barra antes de gravar: salvar isso deixaria o item impossível de pedir e
    // ela não teria como perceber olhando a tela dela.
    const impossiveis = gruposImpossiveis(grupos);
    if (impossiveis.length) {
      addToast('error',
        `Em "${impossiveis[0]}" tudo está em falta, e é uma escolha obrigatória — `
        + 'ninguém consegue pedir o item assim. Deixe ao menos uma disponível, '
        + 'ou marque o item inteiro como indisponível no cardápio.');
      return;
    }
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
              // Três casos reais, e cada um vira um par min/max:
              //   uma     -> exatamente 1, obrigatório   (tamanho, corte)
              //   varias  -> de 1 até N, obrigatório     (2 sabores de pizza)
              //   adicionais -> de 0 até N, opcional     (bacon, morango)
              min_escolhas: g.tipo === 'adicionais' ? 0 : 1,
              max_escolhas: g.tipo === 'uma' ? 1 : teto,
              opcoes: opcoes.map((o) => ({
                nome: o.nome.trim(),
                preco_extra: Number(String(o.preco_extra).replace(',', '.')) || 0,
                disponivel: o.disponivel !== false,
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
                  <option value="uma">Precisa escolher 1</option>
                  <option value="varias">Precisa escolher, pode mais de 1</option>
                  <option value="adicionais">Pode escolher, ou não</option>
                </select>
                {g.tipo !== 'uma' && (
                  <label className="flex items-center gap-1 text-xs text-gray-500">
                    no máximo
                    <input
                      value={g.limite}
                      onChange={(e) => mexer(i, { limite: e.target.value.replace(/\D/g, '') })}
                      placeholder="—"
                      inputMode="numeric"
                      className="min-h-[40px] w-14 rounded-lg border border-gray-300 px-2 text-center text-sm outline-none focus:border-orange-500"
                    />
                  </label>
                )}
                <button
                  onClick={() => setGrupos((gs) => gs.filter((_, k) => k !== i))}
                  className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Remover grupo"
                ><Trash2 size={16} /></button>
              </div>

              {/* Frase do resultado, não do campo.
                  O "até / todos" confundia porque explicava o mecanismo. Aqui
                  a tela diz, em português, exatamente o que o cliente vai ver
                  — e o parceiro confere sem precisar entender a regra. */}
              <p className="mt-2 pl-6 text-xs text-gray-500">
                {(() => {
                  // Conta só as DISPONÍVEIS: a frase promete o que o cliente
                  // vai ver, e ele não vê o que está em falta.
                  const n = g.opcoes.filter((o) => o.nome.trim() && o.disponivel !== false).length;
                  const lim = parseInt(g.limite, 10);
                  const teto = Number.isFinite(lim) && lim > 0 ? Math.min(lim, n || 1) : (n || 1);
                  if (g.tipo === 'uma') {
                    return 'O cliente escolhe 1 destas, obrigatoriamente.';
                  }
                  if (g.tipo === 'varias') {
                    return `O cliente escolhe de 1 até ${teto}, obrigatoriamente.`;
                  }
                  return `O cliente pode escolher até ${teto} — ou nenhuma.`;
                })()}
              </p>

              {/* Avisa na hora, não só ao salvar: ela precisa ver o estrago
                  enquanto ainda está olhando o grupo que causou. */}
              {gruposImpossiveis([g]).length > 0 && (
                <p className="mt-2 ml-6 flex items-start gap-1.5 rounded-lg bg-amber-50 p-2 text-xs font-medium text-amber-800">
                  <AlertTriangle size={14} className="mt-px shrink-0" />
                  <span>
                    Tudo em falta numa escolha obrigatória — assim ninguém
                    consegue pedir este item. Deixe ao menos uma disponível, ou
                    marque o item inteiro como indisponível no cardápio.
                  </span>
                </p>
              )}

              <div className="mt-3 space-y-2 pl-6">
                {g.opcoes.map((o, j) => (
                  // Em falta continua VISÍVEL e editável aqui, só apagada. Se
                  // sumisse da tela dela junto com o cliente, religar no dia
                  // seguinte viraria recadastrar.
                  <div key={j} className={`flex items-center gap-2 ${o.disponivel === false ? 'opacity-60' : ''}`}>
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
                      className={`min-h-[38px] min-w-0 flex-1 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-orange-500 ${
                        o.disponivel === false ? 'line-through decoration-gray-400' : ''}`}
                    />
                    {/* Acabou o molho de alho no sábado: um toque tira do app do
                        cliente e outro devolve. Sem isto, a única saída era
                        apagar a opção e recadastrar depois. */}
                    <button
                      onClick={() => mexerOpcao(i, j, { disponivel: o.disponivel === false })}
                      title={o.disponivel === false
                        ? 'Em falta — não aparece pro cliente. Clique pra voltar a vender.'
                        : 'Disponível. Clique pra marcar em falta.'}
                      aria-pressed={o.disponivel === false}
                      className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold ${
                        o.disponivel === false
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                    >
                      {o.disponivel === false
                        ? <><EyeOff size={14} /> em falta</>
                        : <Eye size={14} />}
                    </button>
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
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => mexer(i, { opcoes: [...g.opcoes, opcaoVazia()] })}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:underline"
                  ><Plus size={14} /> opção</button>
                  <span className="text-xs text-gray-400">
                    O quadradinho é a foto — opcional. Sem ela aparece só o nome.
                    Deixe o valor em branco se a opção for de graça. O olhinho
                    marca em falta: some do app do cliente sem perder o cadastro.
                  </span>
                </div>
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
