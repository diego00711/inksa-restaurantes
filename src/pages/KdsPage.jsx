// src/pages/KdsPage.jsx — Kitchen Display System (tela de cozinha)
// Visão focada para tablet na cozinha: tela cheia, alto contraste, itens
// grandes, poucas colunas e botões enormes. Realtime + som em novo pedido.

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { orderService } from '../services/orderService.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext';
import { useNotificationSound } from '../hooks/useNotificationSound';
import { supabase } from '../lib/supabase';
import { Clock, ChefHat, CheckCircle2, Maximize2, Bell } from 'lucide-react';

const NEW = ['pending', 'Pendente'];
const PREP = ['accepted', 'Aceito', 'preparing', 'Preparando'];
const READY = ['ready', 'Pronto'];

// Normaliza a lista de itens vinda em formatos variados
function parseItems(order) {
  let items = order.items ?? order.itens ?? [];
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch { items = []; }
  }
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => ({
      qty: Number(it.quantity ?? it.qty ?? 1),
      name: it.name ?? it.title ?? it.product_name ?? 'Item',
    }))
    .filter((it) => it.name && it.name !== 'Taxa de Entrega');
}

function minutesSince(ts) {
  if (!ts) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 60000));
}

// ─── Card de pedido ─────────────────────────────────────────────────────────
function KdsCard({ order, accent, children }) {
  const [, force] = useState(0);
  useEffect(() => { const id = setInterval(() => force((n) => n + 1), 30000); return () => clearInterval(id); }, []);
  const mins = minutesSince(order.accepted_at || order.created_at);
  const items = parseItems(order);
  const urgent = mins > 20;
  const customer = order.client_name || order.customer_name || order.cliente_nome || '';

  return (
    <div className={`rounded-xl bg-gray-800 border-l-8 ${accent} shadow-lg p-4 mb-3`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-white font-black text-xl">#{String(order.id).slice(-6).toUpperCase()}</span>
        <span className={`inline-flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full ${urgent ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-700 text-gray-200'}`}>
          <Clock className="w-4 h-4" /> {mins}min
        </span>
      </div>
      {customer && <p className="text-gray-400 text-sm mb-2 truncate">👤 {customer}</p>}
      <ul className="space-y-1.5 mb-4">
        {items.length === 0 && <li className="text-gray-500 text-sm">Sem itens detalhados</li>}
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-white">
            <span className="flex-shrink-0 bg-orange-500 text-white font-black rounded-md min-w-[2rem] h-8 px-2 flex items-center justify-center text-lg">{it.qty}×</span>
            <span className="text-lg font-semibold leading-8">{it.name}</span>
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}

export function KdsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const { user } = useAuth();
  const playSound = useNotificationSound();
  const knownIds = useRef(null);
  const [busy, setBusy] = useState({});

  const fetchOrders = useCallback(async () => {
    try {
      const list = (await orderService.getOrders()) || [];
      setOrders(list);
      if (knownIds.current !== null) {
        const arrived = list.filter((o) => NEW.includes(o.status) && !knownIds.current.has(o.id));
        if (arrived.length) {
          playSound('new_order');
          addToast('success', arrived.length === 1 ? '🔔 Novo pedido!' : `🔔 ${arrived.length} novos pedidos!`);
        }
      }
      knownIds.current = new Set(list.map((o) => o.id));
    } catch (e) {
      addToast('error', e.message || 'Erro ao carregar pedidos.');
    } finally {
      setLoading(false);
    }
  }, [addToast, playSound]);

  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 10000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  // Realtime
  useEffect(() => {
    if (!supabase) return;
    const restaurantId = user?.restaurant_id || user?.id;
    const ch = supabase
      .channel('kds-orders-live')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'orders',
        ...(restaurantId ? { filter: `restaurant_id=eq.${restaurantId}` } : {}),
      }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchOrders]);

  const withBusy = async (id, fn) => {
    setBusy((b) => ({ ...b, [id]: true }));
    try { await fn(); await fetchOrders(); }
    catch (e) { addToast('error', e.message || 'Falha na operação.'); }
    finally { setBusy((b) => ({ ...b, [id]: false })); }
  };

  const accept = (id, minutes) => withBusy(id, async () => {
    await orderService.acceptOrder(id, minutes);
    addToast('success', `✅ Aceito — ${minutes} min`);
  });
  const markReady = (id) => withBusy(id, async () => {
    await orderService.updateOrderStatus(id, 'ready');
    playSound('out_for_delivery');
    addToast('success', '📦 Pronto para retirada!');
  });

  const cols = useMemo(() => {
    const active = orders.filter((o) => !['Arquivado', 'archived', 'cancelled', 'Cancelado'].includes(o.status));
    return {
      novos: active.filter((o) => NEW.includes(o.status)),
      preparo: active.filter((o) => PREP.includes(o.status)),
      prontos: active.filter((o) => READY.includes(o.status)),
    };
  }, [orders]);

  const goFullscreen = () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const Column = ({ title, icon: Icon, count, accentText, children }) => (
    <div className="flex-1 min-w-[280px] flex flex-col">
      <div className="flex items-center justify-between px-2 py-3 sticky top-0">
        <h2 className={`flex items-center gap-2 font-black text-lg ${accentText}`}>
          <Icon className="w-5 h-5" /> {title}
        </h2>
        <span className="bg-gray-700 text-white font-black rounded-full px-3 py-0.5 text-sm">{count}</span>
      </div>
      <div className="overflow-y-auto px-1 flex-1">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white -m-4 sm:-m-6 lg:-m-8 p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <ChefHat className="w-7 h-7 text-orange-500" /> Cozinha
        </h1>
        <button onClick={goFullscreen} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm font-bold">
          <Maximize2 className="w-4 h-4" /> Tela cheia
        </button>
      </div>

      {loading ? (
        <div className="flex gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="flex-1 h-96 bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto" style={{ height: 'calc(100vh - 100px)' }}>
          {/* Novos */}
          <Column title="Novos" icon={Bell} count={cols.novos.length} accentText="text-blue-400">
            {cols.novos.length === 0 && <p className="text-gray-600 text-center text-sm py-8">Sem novos pedidos</p>}
            {cols.novos.map((o) => (
              <KdsCard key={o.id} order={o} accent="border-blue-500">
                <div>
                  <p className="text-gray-400 text-xs font-bold mb-1.5 uppercase">Aceitar e definir o tempo:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[15, 30, 45].map((m) => (
                      <button key={m} disabled={busy[o.id]} onClick={() => accept(o.id, m)}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-3 rounded-lg text-lg">
                        {m}min
                      </button>
                    ))}
                  </div>
                </div>
              </KdsCard>
            ))}
          </Column>

          {/* Em preparo */}
          <Column title="Em Preparo" icon={ChefHat} count={cols.preparo.length} accentText="text-orange-400">
            {cols.preparo.length === 0 && <p className="text-gray-600 text-center text-sm py-8">Nada em preparo</p>}
            {cols.preparo.map((o) => (
              <KdsCard key={o.id} order={o} accent="border-orange-500">
                <button disabled={busy[o.id]} onClick={() => markReady(o.id)}
                  className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black py-4 rounded-lg text-xl flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-6 h-6" /> PRONTO
                </button>
              </KdsCard>
            ))}
          </Column>

          {/* Prontos */}
          <Column title="Prontos" icon={CheckCircle2} count={cols.prontos.length} accentText="text-green-400">
            {cols.prontos.length === 0 && <p className="text-gray-600 text-center text-sm py-8">Nenhum aguardando</p>}
            {cols.prontos.map((o) => (
              <KdsCard key={o.id} order={o} accent="border-green-500">
                <p className="text-center text-green-400 font-bold text-sm">⏳ Aguardando retirada</p>
              </KdsCard>
            ))}
          </Column>
        </div>
      )}
    </div>
  );
}

export default KdsPage;
