// src/pages/CouponsPage.jsx
// Cupons da própria loja. O desconto sai do repasse do parceiro (paid_by =
// 'restaurant'), então a tela deixa isso explícito e o backend aplica um teto
// de % configurável no admin — evita alguém digitar "90" achando que é R$ 90.

import React, { useState, useEffect, useCallback } from 'react';
import { Ticket, Plus, Trash2, Pencil, Loader2, AlertTriangle, X } from 'lucide-react';
import { RESTAURANT_API_URL, createAuthHeaders } from '../services/api';
import { apiFetch } from '../services/apiClient';
import { useToast } from '../context/ToastContext.jsx';

const TIPOS = [
  { value: 'percentage', label: 'Percentual (%)' },
  { value: 'fixed', label: 'Valor fixo (R$)' },
  { value: 'free_delivery', label: 'Frete grátis' },
];

const formVazio = () => ({
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  min_order_value: '',
  max_uses: '',
  uma_vez_por_cliente: false,
  valid_until: '',
  description: '',
});

const brl = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);

const dataBR = (s) => {
  if (!s) return 'Sem prazo';
  try {
    return new Date(s).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch {
    return s;
  }
};

function valorDoCupom(c) {
  if (c.discount_type === 'free_delivery') return 'Frete grátis';
  if (c.discount_type === 'percentage') return `${Number(c.discount_value)}% OFF`;
  return `${brl(c.discount_value)} OFF`;
}

export default function CouponsPage() {
  const { addToast } = useToast();
  const [cupons, setCupons] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [tetoPct, setTetoPct] = useState(30);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null); // cupom em edição (null = novo)
  const [form, setForm] = useState(formVazio());
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [confirmarExclusao, setConfirmarExclusao] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await apiFetch(`${RESTAURANT_API_URL}/api/coupons/mine`, {
        headers: createAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível carregar seus cupons');
      setCupons(Array.isArray(data.coupons) ? data.coupons : []);
      if (data.max_discount_pct) setTetoPct(Number(data.max_discount_pct));
    } catch (e) {
      addToast('error', e.message);
      setCupons([]);
    } finally {
      setCarregando(false);
    }
  }, [addToast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abrirNovo = () => {
    setEditando(null);
    setForm(formVazio());
    setErro('');
    setModalAberto(true);
  };

  const abrirEdicao = (c) => {
    setEditando(c);
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_type === 'free_delivery' ? '' : String(c.discount_value ?? ''),
      min_order_value: c.min_order_value ? String(c.min_order_value) : '',
      max_uses: c.max_uses ? String(c.max_uses) : '',
      uma_vez_por_cliente: Number(c.max_uses_per_client) === 1,
      valid_until: c.valid_until ? String(c.valid_until).slice(0, 10) : '',
      description: c.description || '',
    });
    setErro('');
    setModalAberto(true);
  };

  const salvar = async (e) => {
    e.preventDefault();
    const ehFrete = form.discount_type === 'free_delivery';

    if (!editando && form.code.trim().length < 3) {
      setErro('O código precisa ter ao menos 3 letras.');
      return;
    }
    if (!ehFrete && !(Number(form.discount_value) > 0)) {
      setErro('Informe o valor do desconto.');
      return;
    }
    if (form.discount_type === 'percentage' && Number(form.discount_value) > tetoPct) {
      setErro(`O desconto máximo permitido é ${tetoPct}%.`);
      return;
    }

    const corpo = {
      discount_type: form.discount_type,
      discount_value: ehFrete ? 0 : Number(form.discount_value),
      min_order_value: form.min_order_value ? Number(form.min_order_value) : 0,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      // null (e não 0) quando desmarcado: no banco NULL = sem limite por
      // pessoa, que é como os cupons antigos se comportam.
      max_uses_per_client: form.uma_vez_por_cliente ? 1 : null,
      valid_until: form.valid_until || null,
      description: form.description.trim() || null,
    };
    if (!editando) corpo.code = form.code.trim().toUpperCase();

    setSalvando(true);
    setErro('');
    try {
      const url = editando
        ? `${RESTAURANT_API_URL}/api/coupons/mine/${editando.id}`
        : `${RESTAURANT_API_URL}/api/coupons/mine`;
      const res = await apiFetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: { ...createAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível salvar o cupom');
      addToast('success', editando ? 'Cupom atualizado!' : 'Cupom criado!');
      setModalAberto(false);
      await carregar();
    } catch (e2) {
      setErro(e2.message);
    } finally {
      setSalvando(false);
    }
  };

  const alternarAtivo = async (c) => {
    try {
      const res = await apiFetch(`${RESTAURANT_API_URL}/api/coupons/mine/${c.id}`, {
        method: 'PUT',
        headers: { ...createAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !c.is_active }),
      });
      if (!res.ok) throw new Error('Não foi possível alterar o cupom');
      setCupons((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, is_active: !c.is_active } : x)),
      );
      addToast('success', c.is_active ? 'Cupom pausado.' : 'Cupom ativado!');
    } catch (e) {
      addToast('error', e.message);
    }
  };

  const excluir = async (c) => {
    setConfirmarExclusao(null);
    try {
      const res = await apiFetch(`${RESTAURANT_API_URL}/api/coupons/mine/${c.id}`, {
        method: 'DELETE',
        headers: createAuthHeaders(),
      });
      if (!res.ok) throw new Error('Não foi possível excluir o cupom');
      setCupons((prev) => prev.filter((x) => x.id !== c.id));
      addToast('success', 'Cupom excluído.');
    } catch (e) {
      addToast('error', e.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Ticket className="text-orange-500" size={24} />
            Meus Cupons
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Crie promoções para a sua loja e apareça mais para o cliente.
          </p>
        </div>
        <button
          onClick={abrirNovo}
          className="inline-flex items-center justify-center gap-2 bg-orange-500 text-white font-semibold px-4 py-3 rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus size={18} />
          Novo cupom
        </button>
      </div>

      {/* Regra do dinheiro em destaque: o desconto sai do repasse dele. */}
      <div className="flex gap-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3 mb-5 text-sm">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
        <p>
          O desconto dos <strong>seus</strong> cupons é descontado do seu repasse — a comissão
          da Inksa continua sobre o valor cheio. Desconto máximo permitido:{' '}
          <strong>{tetoPct}%</strong>.
        </p>
      </div>

      {carregando ? (
        <div className="flex justify-center items-center py-16 text-gray-400">
          <Loader2 className="animate-spin mr-2" /> Carregando cupons...
        </div>
      ) : cupons.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <Ticket className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="font-semibold text-gray-700">Você ainda não tem cupons</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Um cupom como <span className="font-mono">BEMVINDO10</span> ajuda a trazer o
            primeiro pedido de quem ainda não conhece a sua loja.
          </p>
          <button
            onClick={abrirNovo}
            className="inline-flex items-center gap-2 bg-orange-500 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-orange-600"
          >
            <Plus size={18} /> Criar meu primeiro cupom
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cupons.map((c) => (
            <div
              key={c.id}
              className={`bg-white rounded-lg border p-4 ${
                c.is_active ? 'border-gray-200' : 'border-gray-200 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono font-bold text-gray-900">{c.code}</p>
                  <p className="text-orange-600 font-semibold text-sm">{valorDoCupom(c)}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {c.is_active ? 'Ativo' : 'Pausado'}
                </span>
              </div>

              {c.description && (
                <p className="text-sm text-gray-600 mt-2">{c.description}</p>
              )}

              <dl className="mt-3 text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <dt>Pedido mínimo</dt>
                  <dd className="text-gray-700">
                    {Number(c.min_order_value) > 0 ? brl(c.min_order_value) : 'Sem mínimo'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Usos</dt>
                  <dd className="text-gray-700">
                    {c.uses_count ?? 0}
                    {c.max_uses ? ` de ${c.max_uses}` : ' (ilimitado)'}
                  </dd>
                </div>
                {Number(c.max_uses_per_client) === 1 && (
                  <div className="flex justify-between">
                    <dt>Por cliente</dt>
                    <dd className="text-gray-700">1 vez só</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt>Válido até</dt>
                  <dd className="text-gray-700">{dataBR(c.valid_until)}</dd>
                </div>
              </dl>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => alternarAtivo(c)}
                  className="flex-1 text-sm font-semibold py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {c.is_active ? 'Pausar' : 'Ativar'}
                </button>
                <button
                  onClick={() => abrirEdicao(c)}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                  aria-label="Editar cupom"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setConfirmarExclusao(c)}
                  className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  aria-label="Excluir cupom"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar/editar */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="font-bold text-lg text-gray-800">
                {editando ? 'Editar cupom' : 'Novo cupom'}
              </h2>
              <button
                onClick={() => setModalAberto(false)}
                className="p-2 text-gray-400 hover:text-gray-700"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={salvar} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código do cupom
                </label>
                <input
                  type="text"
                  value={form.code}
                  disabled={!!editando}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  maxLength={30}
                  placeholder="EX: BEMVINDO10"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 font-mono uppercase disabled:bg-gray-100 disabled:text-gray-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                {editando && (
                  <p className="text-xs text-gray-400 mt-1">
                    O código não muda depois de criado — clientes podem já tê-lo anotado.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de desconto
                </label>
                <select
                  value={form.discount_type}
                  onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  {TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {form.discount_type !== 'free_delivery' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {form.discount_type === 'percentage'
                      ? `Desconto (%) — máximo ${tetoPct}%`
                      : 'Desconto (R$)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    placeholder={form.discount_type === 'percentage' ? '10' : '15.00'}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pedido mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.min_order_value}
                    onChange={(e) => setForm({ ...form, min_order_value: e.target.value })}
                    placeholder="Opcional"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limite de usos
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.max_uses}
                    onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                    placeholder="Ilimitado"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Total, somando todos os clientes.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-orange-50/50">
                <input
                  type="checkbox"
                  checked={form.uma_vez_por_cliente}
                  onChange={(e) => setForm({ ...form, uma_vez_por_cliente: e.target.checked })}
                  className="mt-0.5 h-4 w-4 accent-orange-500"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-800">
                    Só 1 uso por cliente
                  </span>
                  <span className="block text-xs text-gray-500">
                    Sem isso, a mesma pessoa pode usar o cupom quantas vezes
                    quiser — e sozinha consumir todo o limite acima.
                  </span>
                </span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Válido até <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  maxLength={120}
                  placeholder="Ex: Desconto de boas-vindas"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {erro && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {erro}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-3 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-60"
                >
                  {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Criar cupom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmação de exclusão */}
      {confirmarExclusao && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h3 className="font-bold text-gray-800">
              Excluir o cupom {confirmarExclusao.code}?
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Quem já tem o código não vai mais conseguir usar. Se for algo temporário,
              prefira <strong>Pausar</strong>.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setConfirmarExclusao(null)}
                className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => excluir(confirmarExclusao)}
                className="flex-1 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
