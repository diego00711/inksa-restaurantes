// src/pages/OrdersPage.jsx — Kanban + Supabase Realtime + KPIs + Sons
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { orderService } from '../services/orderService.js';
import OrderCard from '../components/OrderCard';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { PickupConfirmationModal } from '../components/PickupConfirmationModal';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../components/ConfirmProvider.jsx';
import { useAuth } from '../context/AuthContext';
import { useNotificationSound } from '../hooks/useNotificationSound';
import { supabase } from '../lib/supabase';
import { SlidersHorizontal, Trash2, TrendingUp, ShoppingBag, DollarSign, Clock, AlertCircle } from 'lucide-react';
import SocialDayBanner from '../components/SocialDayBanner';

// ─── OrderTimer ───────────────────────────────────────────────────────────────
function OrderTimer({ createdAt, acceptedAt }) {
  const [mins, setMins] = useState(0);
  const base = acceptedAt || createdAt;

  useEffect(() => {
    if (!base) return;
    const tick = () => setMins(Math.max(0, Math.floor((Date.now() - new Date(base).getTime()) / 60000)));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [base]);

  const cls = mins > 25
    ? 'text-red-600 bg-red-50 border-red-200'
    : mins > 12
    ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-green-600 bg-green-50 border-green-200';

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      <Clock className="w-3 h-3" />
      {mins}min
    </span>
  );
}

// ─── KPI Bar ──────────────────────────────────────────────────────────────────
function KPIBar({ orders }) {
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrds = orders.filter(o => {
      try { return new Date(o.created_at).toDateString() === today; }
      catch { return false; }
    });
    const delivered = todayOrds.filter(o => ['delivered', 'Entregue'].includes(o.status));
    const revenue = delivered.reduce((s, o) => s + parseFloat(o.total_amount || o.total || 0), 0);
    const ticket = delivered.length ? revenue / delivered.length : 0;
    const inProgress = orders.filter(o =>
      ['pending', 'Pendente', 'accepted', 'Aceito', 'preparing', 'Preparando', 'ready', 'Pronto'].includes(o.status)
    ).length;

    return [
      { label: 'Pedidos Hoje', value: String(todayOrds.length), icon: ShoppingBag, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' },
      { label: 'Faturamento', value: `R$ ${revenue.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
      { label: 'Ticket Médio', value: `R$ ${ticket.toFixed(2)}`, icon: TrendingUp, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-100' },
      { label: 'Em Andamento', value: String(inProgress), icon: AlertCircle, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100' },
    ];
  }, [orders]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
      {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
        <div key={label} className={`${bg} rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border ${border} shadow-sm flex items-center gap-2 sm:gap-3 min-w-0`}>
          <div className={`hidden sm:block p-2.5 rounded-xl bg-white shadow-sm ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide leading-none mb-1 truncate">{label}</p>
            <p className={`text-sm sm:text-xl font-black ${color} leading-none truncate`}>{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Column header ────────────────────────────────────────────────────────────
function ColumnHeader({ emoji, title, count, color, textColor, hasNew }) {
  return (
    <div className={`flex items-center justify-between mb-3 p-2 rounded-lg ${hasNew ? 'animate-pulse' : ''}`}>
      <h2 className={`text-sm font-bold ${textColor} flex items-center gap-1.5`}>
        <span>{emoji}</span>
        {title}
      </h2>
      <span className={`text-xs font-black px-2.5 py-1 rounded-full ${color} ${textColor}`}>{count}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function OrdersPage() {
  const [allOrders, setAllOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  const confirm = useConfirm();
  const { user } = useAuth();
  const playSound = useNotificationSound();

  const knownOrderIds = useRef(null);
  const [newOrderIds, setNewOrderIds] = useState(new Set());

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderForPickup, setSelectedOrderForPickup] = useState(null);
  const [showPickupModal, setShowPickupModal] = useState(false);

  // ── Fetch orders ────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (currentFilters) => {
    try {
      const params = new URLSearchParams();
      if (currentFilters.startDate) params.append('start_date', currentFilters.startDate);
      if (currentFilters.endDate) params.append('end_date', currentFilters.endDate);
      params.append('sort_by', currentFilters.sortBy);
      params.append('sort_order', currentFilters.sortOrder);

      const ordersArray = await orderService.getOrders(params);
      const newOrders = ordersArray || [];
      setAllOrders(newOrders);

      if (knownOrderIds.current !== null) {
        const arrived = newOrders.filter(
          o => ['pending', 'Pendente'].includes(o.status) && !knownOrderIds.current.has(o.id)
        );
        if (arrived.length > 0) {
          // som fica por conta do alarme em loop (useEffect mais abaixo)
          addToast(
            'success',
            arrived.length === 1 ? '🔔 Novo pedido recebido!' : `🔔 ${arrived.length} novos pedidos!`
          );
          const ids = new Set(arrived.map(o => o.id));
          setNewOrderIds(ids);
          setTimeout(() => setNewOrderIds(new Set()), 5000);
        }
      }
      knownOrderIds.current = new Set(newOrders.map(o => o.id));
    } catch (err) {
      addToast('error', err.message || 'Erro ao carregar pedidos.');
      setAllOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [addToast, playSound]);

  // ── Polling ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchOrders(filters);
    const intervalId = setInterval(() => fetchOrders(filters), 10000);
    return () => clearInterval(intervalId);
  }, [fetchOrders, filters]);

  // ── Supabase realtime ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) return;

    const restaurantId = user?.restaurant_id || user?.id;
    const channelConfig = {
      event: '*',
      schema: 'public',
      table: 'orders',
      ...(restaurantId ? { filter: `restaurant_id=eq.${restaurantId}` } : {}),
    };

    const ch = supabase
      .channel('restaurant-orders-live')
      .on('postgres_changes', channelConfig, (payload) => {
        if (payload.eventType === 'INSERT' ||
          (payload.eventType === 'UPDATE' && ['pending', 'Pendente'].includes(payload.new?.status))) {
          // som fica por conta do alarme em loop (useEffect mais abaixo)
          addToast('success', '🔔 Novo pedido recebido!');
        }
        fetchOrders(filters);
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [user, playSound, addToast, fetchOrders, filters]);

  // ── Status update ───────────────────────────────────────────────────────────
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      if (['accepted_by_delivery', 'delivering'].includes(newStatus)) playSound('out_for_delivery');
      if (['delivered', 'Entregue'].includes(newStatus)) playSound('delivered');
      addToast('success', `Status atualizado!`);
      fetchOrders(filters);
    } catch (err) {
      addToast('error', `Falha: ${err.message}`);
    }
  };

  const handleAcceptOrder = async (orderId, estimatedTime) => {
    try {
      await orderService.acceptOrder(orderId, estimatedTime);
      playSound('new_order');
      addToast('success', `✅ Pedido aceito! Tempo estimado: ${estimatedTime} min`);
      fetchOrders(filters);
    } catch (err) {
      addToast('error', `Falha ao aceitar: ${err.message}`);
    }
  };

  const handleRemoveOrder = async (orderId) => {
    if (!(await confirm({ title: 'Remover pedido', message: 'Remover este pedido do painel?', confirmText: 'Remover', danger: true }))) return;
    try {
      await orderService.updateOrderStatus(orderId, 'Arquivado');
      addToast('success', 'Pedido removido do painel!');
      fetchOrders(filters);
    } catch (err) {
      addToast('error', `Erro: ${err.message}`);
    }
  };

  const handleOpenPickupModal = (order) => { setSelectedOrderForPickup(order); setShowPickupModal(true); };
  const handleClosePickupModal = () => { setSelectedOrderForPickup(null); setShowPickupModal(false); };
  const handlePickupSuccess = () => { fetchOrders(filters); };
  const handleInputChange = (e) => { setFilters(prev => ({ ...prev, [e.target.name]: e.target.value })); };
  const handleApplyFilters = () => { fetchOrders(filters); };
  const handleClearFilters = () => {
    const d = { startDate: '', endDate: '', sortBy: 'created_at', sortOrder: 'desc' };
    setFilters(d);
    fetchOrders(d);
  };
  const handleViewOrderDetails = (order) => { setSelectedOrder(order); setIsModalOpen(true); };
  const handleCloseModal = () => { setSelectedOrder(null); setIsModalOpen(false); };

  // ── Column data ─────────────────────────────────────────────────────────────
  const columns = useMemo(() => {
    const active = allOrders.filter(o => !['Arquivado', 'archived'].includes(o.status));
    return {
      novos:              active.filter(o => ['pending', 'Pendente'].includes(o.status)),
      emPreparo:          active.filter(o => ['accepted', 'Aceito', 'preparing', 'Preparando'].includes(o.status)),
      prontos:            active.filter(o => ['ready', 'Pronto'].includes(o.status)),
      aguardandoRetirada: active.filter(o => ['accepted_by_delivery', 'Aguardando Retirada'].includes(o.status)),
      saiuParaEntrega:    active.filter(o => ['delivering', 'Saiu para Entrega', 'Entregando'].includes(o.status)),
      entregues:          active.filter(o => ['delivered', 'Entregue'].includes(o.status)),
    };
  }, [allOrders]);

  const hasNewOrders = newOrderIds.size > 0;

  // ── Alarme sonoro: repete enquanto houver pedido em "Novos" (aguardando o
  // restaurante aceitar). Para sozinho quando o restaurante aceita todos (saem
  // da coluna). Depende do BOOLEANO pra a cadência de 5s ficar estável.
  // (Diego: aviso sonoro quando o restaurante recebe um pedido.)
  const hasPendingNovos = columns.novos.length > 0;
  useEffect(() => {
    if (!hasPendingNovos) return;
    playSound('new_order');
    const id = window.setInterval(() => playSound('new_order'), 5000);
    return () => window.clearInterval(id);
  }, [hasPendingNovos, playSound]);

  // ── Column wrapper ──────────────────────────────────────────────────────────
  const Col = ({ bg, emoji, title, count, textColor, badgeColor, orders, showRemove = false, isNewCol = false }) => (
    <div className={`${bg} rounded-xl p-3 flex flex-col min-w-[240px] border border-white/80 shadow-sm`}>
      <ColumnHeader emoji={emoji} title={title} count={count} color={badgeColor} textColor={textColor} hasNew={isNewCol && hasNewOrders} />
      <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-0.5">
        {orders.length > 0 ? (
          orders.map(order => (
            <div
              key={order.id}
              className={`${newOrderIds.has(order.id) ? 'animate-in slide-in-from-top-4 duration-300' : ''}`}
            >
              {/* Timer badge */}
              <div className="flex justify-end mb-1">
                <OrderTimer createdAt={order.created_at} acceptedAt={order.accepted_at} />
              </div>
              <OrderCard
                order={order}
                onUpdateStatus={handleUpdateStatus}
                onAcceptOrder={handleAcceptOrder}
                onViewDetails={handleViewOrderDetails}
                onConfirmPickup={handleOpenPickupModal}
              />
              {showRemove && (
                <button
                  onClick={() => handleRemoveOrder(order.id)}
                  className="mt-1.5 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors border border-red-100"
                >
                  <Trash2 size={11} /> Remover
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-xs text-center text-gray-400 py-6">Nenhum pedido</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full flex flex-col bg-gray-50">
      {/* Dia I — Inksa Social (só aparece quando habilitado no admin) */}
      <SocialDayBanner />
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Painel de Pedidos</h1>
          {hasNewOrders && (
            <span className="flex items-center gap-1.5 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-bounce">
              🔔 Novo!
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-xl shadow-sm hover:bg-gray-50 transition-colors min-h-[44px]"
        >
          <SlidersHorizontal size={16} />
          {showAdvancedFilters ? 'Ocultar Filtros' : 'Filtros'}
        </button>
      </div>

      {/* ── KPI Bar ────────────────────────────────────────────────────────── */}
      <KPIBar orders={allOrders} />

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      {showAdvancedFilters && (
        <div className="bg-white p-4 rounded-xl shadow-sm mb-5 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">De</label>
              <input type="date" name="startDate" value={filters.startDate} onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 shadow-sm text-base focus:border-indigo-500 focus:ring-indigo-500 min-h-[44px] px-2" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Até</label>
              <input type="date" name="endDate" value={filters.endDate} onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 shadow-sm text-base focus:border-indigo-500 focus:ring-indigo-500 min-h-[44px] px-2" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Ordenar por</label>
              <select name="sortBy" value={filters.sortBy} onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 shadow-sm text-base focus:border-indigo-500 focus:ring-indigo-500 min-h-[44px] px-2">
                <option value="created_at">Data</option>
                <option value="total_amount">Valor</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleApplyFilters}
                className="flex-1 py-2 px-4 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors min-h-[44px]">
                Aplicar
              </button>
              <button onClick={handleClearFilters}
                className="p-2 rounded-lg border hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px]" title="Limpar">
                🧹
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Kanban ─────────────────────────────────────────────────────────── */}
      <div className="flex-grow overflow-x-auto">
        {isLoading ? (
          <div className="flex gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="min-w-[240px] h-64 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 min-w-max 2xl:min-w-0">
            <Col
              bg="bg-blue-50" emoji="📥" title="Novos" count={columns.novos.length}
              textColor="text-blue-700" badgeColor="bg-blue-200"
              orders={columns.novos} isNewCol
            />
            <Col
              bg="bg-orange-50" emoji="👨‍🍳" title="Preparando" count={columns.emPreparo.length}
              textColor="text-orange-700" badgeColor="bg-orange-200"
              orders={columns.emPreparo}
            />
            <Col
              bg="bg-yellow-50" emoji="📦" title="Prontos" count={columns.prontos.length}
              textColor="text-yellow-700" badgeColor="bg-yellow-200"
              orders={columns.prontos}
            />
            <Col
              bg="bg-pink-50" emoji="⏳" title="Aguardando" count={columns.aguardandoRetirada.length}
              textColor="text-pink-700" badgeColor="bg-pink-200"
              orders={columns.aguardandoRetirada}
            />
            <Col
              bg="bg-purple-50" emoji="🚗" title="Em Rota" count={columns.saiuParaEntrega.length}
              textColor="text-purple-700" badgeColor="bg-purple-200"
              orders={columns.saiuParaEntrega}
            />
            <Col
              bg="bg-green-50" emoji="✅" title="Entregues" count={columns.entregues.length}
              textColor="text-green-700" badgeColor="bg-green-200"
              orders={columns.entregues} showRemove
            />
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {isModalOpen && selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={handleCloseModal} />
      )}
      {showPickupModal && selectedOrderForPickup && (
        <PickupConfirmationModal
          order={selectedOrderForPickup}
          isOpen={showPickupModal}
          onClose={handleClosePickupModal}
          onSuccess={handlePickupSuccess}
        />
      )}
    </div>
  );
}
