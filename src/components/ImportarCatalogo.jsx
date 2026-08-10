// src/components/ImportarCatalogo.jsx
// Importa catálogo de planilha (CSV) exportada do sistema da loja.
//
// Existe por causa de farmácia/mercado/pet: 3 mil a 8 mil itens não se
// cadastram um a um. O parceiro exporta do sistema dele e sobe aqui.
//
// O parse é no navegador de propósito: dá pra mostrar a prévia ANTES de gravar
// qualquer coisa, e o parceiro corrige o mapeamento das colunas vendo o
// resultado. Mandar o arquivo cru pro servidor obrigaria a subir, processar e
// só então descobrir que a coluna do preço era outra.

import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { RESTAURANT_API_URL, createAuthHeaders } from '../services/api';
import { apiFetch } from '../services/apiClient';
import { useToast } from '../context/ToastContext.jsx';

const LOTE = 500;          // o backend recusa acima disso

// Nomes de coluna que aparecem nos sistemas de PDV/ERP daqui. Normalizados
// (sem acento, minúsculo) na hora de comparar.
const APELIDOS = {
  name:        ['nome', 'produto', 'descricao', 'descricao do produto', 'item', 'mercadoria', 'nome do produto'],
  price:       ['preco', 'preco venda', 'preco de venda', 'valor', 'venda', 'pr venda', 'preco_venda', 'vlr venda'],
  ean:         ['ean', 'codigo de barras', 'cod barras', 'barras', 'gtin', 'codbarra', 'codigo barras'],
  stock:       ['estoque', 'qtd', 'quantidade', 'saldo', 'estoque atual', 'qtde'],
  category:    ['categoria', 'grupo', 'secao', 'departamento', 'familia', 'classe'],
  description: ['detalhe', 'observacao', 'complemento', 'apresentacao'],
};

const semAcento = (s) =>
  String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

/** Lê o arquivo tentando UTF-8 e caindo pra Windows-1252.
 *  Exportação de ERP brasileiro quase sempre vem em ANSI — em UTF-8 os acentos
 *  viram caractere quebrado e o catálogo inteiro entra torto. */
async function lerTexto(file) {
  const buf = await file.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder('windows-1252').decode(buf);
  }
}

/** Descobre o separador olhando o cabeçalho. No Excel em português o padrão é
 *  ponto e vírgula, não vírgula. */
function acharSeparador(linha) {
  const cand = [';', ',', '\t', '|'];
  return cand.reduce((a, b) =>
    (linha.split(b).length > linha.split(a).length ? b : a), ';');
}

/** Parser de CSV que respeita aspas (campo com o separador dentro). */
function parseCSV(texto) {
  const limpo = texto.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const primeira = limpo.slice(0, limpo.indexOf('\n') === -1 ? undefined : limpo.indexOf('\n'));
  const sep = acharSeparador(primeira);

  const linhas = [];
  let campo = '', linha = [], dentroDeAspas = false;
  for (let i = 0; i < limpo.length; i++) {
    const c = limpo[i];
    if (dentroDeAspas) {
      if (c === '"') {
        if (limpo[i + 1] === '"') { campo += '"'; i++; } else dentroDeAspas = false;
      } else campo += c;
    } else if (c === '"') dentroDeAspas = true;
    else if (c === sep) { linha.push(campo); campo = ''; }
    else if (c === '\n') { linha.push(campo); linhas.push(linha); linha = []; campo = ''; }
    else campo += c;
  }
  if (campo !== '' || linha.length) { linha.push(campo); linhas.push(linha); }

  const cabecalho = (linhas.shift() || []).map((h) => h.trim());
  return { cabecalho, linhas: linhas.filter((l) => l.some((c) => String(c).trim() !== '')) };
}

function autoMapear(cabecalho) {
  const mapa = {};
  const usados = new Set();
  for (const [campo, apelidos] of Object.entries(APELIDOS)) {
    const idx = cabecalho.findIndex(
      (h, i) => !usados.has(i) && apelidos.includes(semAcento(h)));
    if (idx >= 0) { mapa[campo] = idx; usados.add(idx); }
  }
  return mapa;
}

export default function ImportarCatalogo({ aberto, onFechar, onConcluido }) {
  const { addToast } = useToast();
  const [dados, setDados] = useState(null);      // {cabecalho, linhas}
  const [mapa, setMapa] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');

  if (!aberto) return null;

  const escolherArquivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(''); setResultado(null);
    try {
      const { cabecalho, linhas } = parseCSV(await lerTexto(file));
      if (!cabecalho.length || !linhas.length) {
        setErro('A planilha parece vazia. Ela precisa ter uma linha de cabeçalho e pelo menos um produto.');
        return;
      }
      setDados({ cabecalho, linhas });
      setMapa(autoMapear(cabecalho));
    } catch (e2) {
      setErro('Não consegui ler o arquivo: ' + e2.message);
    }
  };

  const valor = (linha, campo) => {
    const i = mapa[campo];
    return i === undefined || i === null ? '' : (linha[i] ?? '').trim();
  };

  const montarItens = () =>
    dados.linhas.map((l) => ({
      name: valor(l, 'name'),
      price: valor(l, 'price'),
      ean: valor(l, 'ean'),
      stock: valor(l, 'stock'),
      category: valor(l, 'category'),
      description: valor(l, 'description'),
    }));

  const enviar = async () => {
    if (mapa.name === undefined || mapa.price === undefined) {
      setErro('Escolha pelo menos as colunas de NOME e PREÇO.');
      return;
    }
    setEnviando(true); setErro(''); setProgresso(0);
    const itens = montarItens();
    const soma = { recebidos: 0, criados: 0, atualizados: 0, ignorados: [], total_ignorados: 0 };
    try {
      for (let i = 0; i < itens.length; i += LOTE) {
        const lote = itens.slice(i, i + LOTE);
        const res = await apiFetch(`${RESTAURANT_API_URL}/api/menu/import`, {
          method: 'POST',
          headers: { ...createAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: lote }),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.error || `Falha no lote ${i / LOTE + 1}`);
        soma.recebidos += d.recebidos || 0;
        soma.criados += d.criados || 0;
        soma.atualizados += d.atualizados || 0;
        soma.total_ignorados += d.total_ignorados || 0;
        soma.ignorados.push(...(d.ignorados || []));
        setProgresso(Math.min(100, Math.round(((i + lote.length) / itens.length) * 100)));
      }
      setResultado(soma);
      addToast('success', `${soma.criados} novos, ${soma.atualizados} atualizados.`);
      onConcluido?.();
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const previa = dados ? dados.linhas.slice(0, 5) : [];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-3xl rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <FileSpreadsheet className="text-orange-500" size={20} />
            Importar catálogo por planilha
          </h2>
          <button onClick={onFechar} className="p-2 text-gray-400 hover:text-gray-700" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {!dados && !resultado && (
            <>
              <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-900">
                Exporte a lista de produtos do seu sistema em <strong>CSV</strong> (ou
                salve o Excel como “CSV separado por ponto e vírgula”) e escolha o
                arquivo aqui. Eu identifico as colunas sozinho e mostro uma prévia
                antes de gravar qualquer coisa.
              </div>
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-10 cursor-pointer hover:bg-gray-50">
                <Upload className="text-gray-400" size={32} />
                <span className="font-semibold text-gray-700">Escolher planilha</span>
                <span className="text-xs text-gray-500">CSV, separado por ; ou ,</span>
                <input type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={escolherArquivo} />
              </label>
            </>
          )}

          {dados && !resultado && (
            <>
              <p className="text-sm text-gray-600">
                <strong>{dados.linhas.length}</strong> produtos encontrados. Confira se
                as colunas estão certas:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  ['name', 'Nome *'], ['price', 'Preço *'], ['ean', 'Código de barras'],
                  ['stock', 'Estoque'], ['category', 'Categoria'], ['description', 'Descrição'],
                ].map(([campo, rotulo]) => (
                  <div key={campo}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{rotulo}</label>
                    <select
                      value={mapa[campo] ?? ''}
                      onChange={(e) => setMapa({
                        ...mapa,
                        [campo]: e.target.value === '' ? undefined : Number(e.target.value),
                      })}
                      className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm"
                    >
                      <option value="">— não tenho —</option>
                      {dados.cabecalho.map((h, i) => (
                        <option key={i} value={i}>{h || `Coluna ${i + 1}`}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-gray-200 overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-2 py-2 text-left">Nome</th>
                      <th className="px-2 py-2 text-left">Preço</th>
                      <th className="px-2 py-2 text-left">Cód. barras</th>
                      <th className="px-2 py-2 text-left">Estoque</th>
                      <th className="px-2 py-2 text-left">Categoria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previa.map((l, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1.5">{valor(l, 'name') || <span className="text-red-500">—</span>}</td>
                        <td className="px-2 py-1.5">{valor(l, 'price') || <span className="text-red-500">—</span>}</td>
                        <td className="px-2 py-1.5 text-gray-500">{valor(l, 'ean') || '—'}</td>
                        <td className="px-2 py-1.5 text-gray-500">{valor(l, 'stock') || '—'}</td>
                        <td className="px-2 py-1.5 text-gray-500">{valor(l, 'category') || 'Geral'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 text-sm bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-900">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p>
                  Produto que já existe é <strong>atualizado</strong>, não duplicado —
                  pelo código de barras quando tem, senão pelo nome. Item com estoque
                  <strong> zero</strong> aparece no app como indisponível, em vez de sumir.
                </p>
              </div>

              {enviando && (
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 transition-all" style={{ width: `${progresso}%` }} />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setDados(null); setMapa({}); }}
                  disabled={enviando}
                  className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold disabled:opacity-60"
                >
                  Trocar arquivo
                </button>
                <button
                  onClick={enviar}
                  disabled={enviando}
                  className="flex-1 py-3 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {enviando ? <><Loader2 className="animate-spin" size={16} /> Importando… {progresso}%</>
                            : `Importar ${dados.linhas.length} produtos`}
                </button>
              </div>
            </>
          )}

          {resultado && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700 font-bold">
                <CheckCircle2 size={20} /> Importação concluída
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[['Novos', resultado.criados], ['Atualizados', resultado.atualizados],
                  ['Ignorados', resultado.total_ignorados]].map(([r, v]) => (
                  <div key={r} className="rounded-lg border border-gray-200 p-3">
                    <p className="text-2xl font-black text-gray-800">{v}</p>
                    <p className="text-xs text-gray-500">{r}</p>
                  </div>
                ))}
              </div>
              {resultado.ignorados.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 max-h-48 overflow-y-auto">
                  <p className="text-xs font-bold text-amber-900 mb-1">
                    Linhas que não entraram (confira e reimporte só elas se quiser):
                  </p>
                  <ul className="text-xs text-amber-900 space-y-0.5">
                    {resultado.ignorados.map((ig, i) => (
                      <li key={i}>linha {ig.linha}: {ig.nome ? `"${ig.nome}" — ` : ''}{ig.motivo}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button onClick={onFechar}
                      className="w-full py-3 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600">
                Ver meu cardápio
              </button>
            </div>
          )}

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{erro}</p>
          )}
        </div>
      </div>
    </div>
  );
}
