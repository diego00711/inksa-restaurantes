// src/pages/OrdersPage.jsx — Kanban + Supabase Realtime + KPIs + Sons
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { orderService } from '../services/orderService.js';
import OrderCard from '../components/OrderCard';
import AvisoCardapioVazio from '../components/AvisoCardapioVazio';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { PickupConfirmationModal } from '../components/PickupConfirmationModal';
import { DeliveryConfirmationModal } from '../components/DeliveryConfirmationModal';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../components/ConfirmProvider.jsx';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useNotificationSound } from '../hooks/useNotificationSound';
import { supabase } from '../lib/supabase';
import { SlidersHorizontal, Trash2, TrendingUp, ShoppingBag, DollarSign, Clock, AlertCircle, Star, X } from 'lucide-react';
import SocialDayBanner from '../components/SocialDayBanner';
import SponsoredStrip from '../components/SponsoredStrip';
import ClientReviewForm from '../components/ClientReviewForm';
import DeliveryReviewForm from '../components/DeliveryReviewForm';
import IncidentAlerts from '../components/IncidentAlerts.jsx';
import { printOrder, ehAplicativo, ENDERECO_WEB } from '../utils/orderPrint';

// ─── OrderTimer ───────────────────────────────────────────────────────────────
function OrderTimer({ createdAt, acceptedAt, finishedAt, parado = false }) {
  const [mins, setMins] = useState(0);
  // Pedido fechado SEM carimbo de quando fechou: não dá pra saber quanto
  // levou, e inventar é pior que calar. Antes o código caía em Date.now(),
  // que "congelava" na hora em que a PÁGINA abriu — então o mesmo pedido
  // mostrava 1min hoje e 1400min amanhã, sem nada ter mudado nele.
  const semCarimbo = parado && Number.isNaN(new Date(finishedAt ?? NaN).getTime());
  // Congela a base: assim que o pedido tiver um accepted_at, conta SEMPRE a
  // partir dele — mesmo que uma atualização seguinte venha sem esse campo. Sem
  // isso, o tempo "pulava" (ex.: 60min desde criado ↔ 20min desde aceito) quando
  // o accepted_at oscilava entre as atualizações. Antes de aceitar, conta desde
  // created_at.
  const stickyAcceptedRef = useRef(acceptedAt || null);
  if (acceptedAt) stickyAcceptedRef.current = acceptedAt;
  const base = stickyAcceptedRef.current || createdAt;

  useEffect(() => {
    if (!base) return undefined;
    // Pedido FECHADO tem cronômetro CONGELADO: passa a mostrar quanto tempo a
    // entrega levou, não quanto tempo faz que ela terminou. Contar pra sempre
    // gerava "1547min" num pedido já entregue — número que assusta e não
    // informa nada. Sem carimbo de fechamento, não mostra nada (ver acima).
    const fim = parado ? new Date(finishedAt ?? NaN).getTime() : null;
    const tick = () => {
      const t = new Date(base).getTime();
      if (Number.isNaN(t)) return; // data inválida: não mexe no valor exibido
      if (parado && Number.isNaN(fim)) return; // sem carimbo: não exibe nada
      const ate = (fim && !Number.isNaN(fim)) ? fim : Date.now();
      setMins(Math.max(0, Math.floor((ate - t) / 60000)));
    };
    tick();
    if (parado) return undefined; // congelado: nada de intervalo
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [base, parado, finishedAt]);

  if (semCarimbo) return null;

  // Fechado é neutro (cinza): vermelho ali só passaria a impressão de que ainda
  // tem alguma coisa atrasada pra resolver.
  const cls = parado
    ? 'text-gray-500 bg-gray-50 border-gray-200'
    : mins > 25
    ? 'text-red-600 bg-red-50 border-red-200'
    : mins > 12
    ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-green-600 bg-green-50 border-green-200';

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${cls}`}
          title={parado ? 'Tempo total desta entrega' : 'Tempo desde o aceite'}>
      <Clock className="w-3 h-3" />
      {parado ? `levou ${mins}min` : `${mins}min`}
    </span>
  );
}

// ─── KPI Bar ──────────────────────────────────────────────────────────────────
function KPIBar({ orders }) {
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    // Não conta pedido "fantasma" nas métricas: aguardando pagamento (não pago)
    // ou cancelado. Arquivar NÃO tira da conta: o pedido arquivado continua com
    // o status real (delivered) e é uma venda do dia — só some das colunas do
    // kanban, não do faturamento. (O status 'archived' nem existe mais no modelo
    // novo, mas fica na lista por segurança pra dados antigos.)
    const JUNK = ['awaiting_payment', 'cancelled', 'canceled', 'Cancelado'];
    const todayOrds = orders.filter(o => {
      try { return new Date(o.created_at).toDateString() === today && !JUNK.includes(o.status); }
      catch { return false; }
    });
    // Faturamento = o que o RESTAURANTE recebe, não o total do pedido. O total
    // inclui o frete (que é do entregador) e não desconta a comissão da
    // plataforma. O valor certo é o repasse do restaurante
    // (valor_repassado_restaurante = itens − comissão), o MESMO que o Financeiro
    // usa. Fallback pro subtotal dos itens (sem frete) quando o pedido ainda não
    // foi liquidado (ex.: dinheiro em preparo) — nunca soma o frete.
    const receitaRestaurante = (o) => {
      const v = o.valor_repassado_restaurante;
      if (v !== null && v !== undefined && v !== '') return parseFloat(v) || 0;
      return parseFloat(o.total_amount_items ?? 0) || 0;
    };
    const revenue = todayOrds.reduce((s, o) => s + receitaRestaurante(o), 0);
    const ticket = todayOrds.length ? revenue / todayOrds.length : 0;
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

// ─── Column wrapper ───────────────────────────────────────────────────────────
// DEFINIDO FORA da página de propósito. Antes vivia dentro de OrdersPage: a cada
// render (o painel busca a cada 6s) o React via um TIPO de componente novo,
// desmontava a coluna inteira e montava outra — o estado dos filhos ia junto.
// Era por isso que o "tempo estimado de preparo" escolhido (ex.: 60min) voltava
// sozinho pro padrão de 20min alguns segundos depois.
function Col({
  bg, emoji, title, count, textColor, badgeColor, orders,
  showRemove = false, isNewCol = false,
  hasNewOrders, newOrderIds, isOwnDelivery,
  onUpdateStatus, onAcceptOrder, onViewDetails, onConfirmPickup, onConfirmDelivery,
  onRemove, onPrint,
}) {
  return (
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
                <OrderTimer
                  createdAt={order.created_at}
                  acceptedAt={order.accepted_at}
                  // `completed_at` agora É escrito, no momento em que a
                  // entrega fecha (orders.py). Antes ninguém escrevia nele e
                  // isto aqui usava `updated_at` — que muda toda vez que
                  // QUALQUER rotina toca a linha (gerador de repasses,
                  // arquivamento, job de madrugada). O #1000 levou 9 minutos e
                  // a tela dizia "levou 240min", crescendo a cada rotina.
                  // Parecia cronômetro que não parava; era carimbo errado
                  // sendo empurrado pra frente.
                  //
                  // A reserva no updated_at fica pros pedidos anteriores a
                  // 29/08 que ainda não tenham o carimbo — errado, mas menos
                  // errado que não mostrar nada.
                  finishedAt={order.completed_at || order.updated_at}
                  // AS DUAS FORMAS, PT E EN. O orderService TRADUZ o status
                  // antes da tela ver ('delivered' vira 'Entregue'), então uma
                  // lista só em inglês nunca casa — era por isso que o
                  // cronômetro não congelava e um pedido entregue ontem
                  // aparecia com centenas de minutos. Todo o resto deste
                  // arquivo já lista os dois; só aqui tinha ficado de fora.
                  parado={['delivered', 'Entregue',
                           'cancelled', 'canceled', 'Cancelado',
                           'completed', 'delivery_failed']
                    .includes(order.status)}
                />
              </div>
              <OrderCard
                order={order}
                isOwnDelivery={isOwnDelivery}
                onUpdateStatus={onUpdateStatus}
                onAcceptOrder={onAcceptOrder}
                onViewDetails={onViewDetails}
                onConfirmPickup={onConfirmPickup}
                onConfirmDelivery={onConfirmDelivery}
                onPrint={onPrint}
              />
              {showRemove && (
                <button
                  onClick={() => onRemove(order.id)}
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
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function OrdersPage() {
  const [allOrders, setAllOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  const confirm = useConfirm();
  const { user } = useAuth();
  const { profile } = useProfile();
  // Entrega própria: o restaurante despacha com a própria moto (sem entregador
  // Inksa). O card mostra "Saiu para Entrega" e "Confirmar Entrega" em vez de
  // pedir o código do entregador (que não existe nesse caso).
  const isOwnDelivery = (profile?.delivery_type === 'own');
  const playSound = useNotificationSound();

  const knownOrderIds = useRef(null);
  const [newOrderIds, setNewOrderIds] = useState(new Set());
  // Pedidos escondidos SÓ NESTE APARELHO (localStorage) — ver utils/orderPrint.

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  // Feedback do botão Aplicar: "applying" enquanto busca; "appliedRange" guarda
  // o filtro que está ativo agora (pra marcar o botão como "aplicado").
  const [applying, setApplying] = useState(false);
  const [appliedRange, setAppliedRange] = useState({ startDate: '', endDate: '', sortBy: 'created_at', sortOrder: 'desc' });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderForPickup, setSelectedOrderForPickup] = useState(null);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [orderForDelivery, setOrderForDelivery] = useState(null);
  // Avaliação após a retirada ("Avaliar / deixar pra depois"). O parceiro avalia
  // o ENTREGADOR e o CLIENTE em sequência (reviewStep). Na entrega própria não há
  // entregador Inksa, então começa direto no cliente.
  const [pendingReviewOrder, setPendingReviewOrder] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewStep, setReviewStep] = useState('delivery'); // 'delivery' | 'client'

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
    const intervalId = setInterval(() => fetchOrders(filters), 6000);
    return () => clearInterval(intervalId);
  }, [fetchOrders, filters]);

  // ── Supabase realtime ───────────────────────────────────────────────────────
  // ── Realtime do Supabase REMOVIDO (auditoria de 18/08/2026) ────────────────
  //
  // Havia aqui uma inscrição em postgres_changes que NUNCA entregou um evento
  // sequer. A política de RLS resolve o dono comparando auth.uid() com colunas
  // que apontam pro PERFIL, não pro usuário do auth — medido no banco:
  // client_profiles.id = user_id em 0 de 24, delivery_profiles em 0 de 6 (só
  // restaurant_profiles casa, 17 de 17). E nenhum app chama
  // supabase.auth.setSession: todos conectam como anon puro, então auth.uid()
  // é NULL e nenhuma política casa.
  //
  // Provado com a chave anon do pacote publicado:
  //   GET /rest/v1/orders  ->  0 linhas
  //   GET /rest/v1/chat_messages  ->  0 linhas
  //   GET /rest/v1/delivery_tracking  ->  0 linhas
  // Sem leitura não há evento: o canal conectava e ficava mudo.
  //
  // Isso está CERTO em segurança (nenhum anônimo lê pedido ou conversa alheia).
  // O problema era o canal existir e PARECER que funcionava — em 18/08 essa
  // aparência me levou a afrouxar o polling de 6s pra 20s "porque o realtime
  // cobre". Não cobria.
  //
  // O que ele prometia já vem por dois caminhos que funcionam: o POLLING desta
  // mesma tela (app aberto) e o PUSH do FCM (app em segundo plano).
  //
  // PRA RESSUSCITAR seriam DUAS coisas, nesta ordem: (1) os apps abrirem sessão
  // no Supabase com setSession e (2) reescrever as políticas pra resolver o
  // perfil (client_id IN (SELECT id FROM client_profiles WHERE user_id =
  // auth.uid())). Mexer só numa das duas não liga nada.


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
      playSound('accepted'); // som curto de confirmação (sem a voz de "novo pedido")
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
  const handlePickupSuccess = () => {
    // onSuccess roda antes do onClose, então o pedido ainda está aqui: guarda
    // pra oferecer avaliar o entregador e o cliente logo depois que o modal de
    // retirada fechar.
    const order = selectedOrderForPickup;
    fetchOrders(filters);
    if (order?.client_id) {
      setShowReviewForm(false);
      // Se há entregador Inksa no pedido, começa por ele; senão vai pro cliente.
      setReviewStep(order.delivery_id ? 'delivery' : 'client');
      setPendingReviewOrder(order);
    }
  };
  // Entrega própria: fechar o pedido pede o código do cliente (prova de que o
  // motoboy da loja entregou mesmo). O modal cuida da chamada ao /complete.
  const handleOpenDeliveryModal = (order) => { setOrderForDelivery(order); };
  const handleDeliverySuccess = () => {
    const order = orderForDelivery;
    fetchOrders(filters);
    // Mesmo gancho da retirada: com o pedido fechado, oferece avaliar o cliente.
    if (order?.client_id) {
      setShowReviewForm(false);
      setReviewStep('client');
      setPendingReviewOrder(order);
    }
  };

  // Imprime a comanda do pedido (via de 80mm pelo navegador).
  const handlePrintOrder = useCallback((order) => {
    const ok = printOrder(order, profile?.restaurant_name || '');
    if (!ok) {
      addToast('error', 'Não foi possível abrir a impressão.');
      return;
    }
    // No aplicativo a impressão pode não abrir NADA: a WebView do Android não
    // implementa print(), e a chamada falha em silêncio. Como não dá pra
    // detectar isso depois, o aviso sai junto — melhor um aviso a mais no
    // navegador (onde funciona) do que a parceira apertando um botão morto e
    // concluindo que o sistema não presta.
    if (ehAplicativo()) {
      addToast('info',
        `Se a impressão não abrir, imprima pelo navegador: ${ENDERECO_WEB}`);
    }
  }, [profile?.restaurant_name, addToast]);

  const handleInputChange = (e) => { setFilters(prev => ({ ...prev, [e.target.name]: e.target.value })); };
  const handleApplyFilters = async () => {
    setApplying(true);
    try {
      await fetchOrders(filters);
      setAppliedRange({ ...filters });
    } finally {
      setApplying(false);
    }
  };
  const handleClearFilters = () => {
    const d = { startDate: '', endDate: '', sortBy: 'created_at', sortOrder: 'desc' };
    setFilters(d);
    setAppliedRange(d);
    fetchOrders(d);
  };
  // Filtro "aplicado" = há um período ativo E os inputs batem com o que foi
  // aplicado (se o usuário mexer nas datas de novo, volta a "Aplicar").
  const filterApplied =
    (appliedRange.startDate || appliedRange.endDate) &&
    appliedRange.startDate === filters.startDate &&
    appliedRange.endDate === filters.endDate &&
    appliedRange.sortBy === filters.sortBy &&
    appliedRange.sortOrder === filters.sortOrder;
  const handleViewOrderDetails = (order) => { setSelectedOrder(order); setIsModalOpen(true); };
  const handleCloseModal = () => { setSelectedOrder(null); setIsModalOpen(false); };

  // ── Column data ─────────────────────────────────────────────────────────────
  const columns = useMemo(() => {
    // No modo AO VIVO (sem filtro de data) o painel esconde os arquivados —
    // arquivar = limpar o painel. MAS quando há um filtro de data aplicado é uma
    // CONSULTA DE HISTÓRICO: aí mostramos também os arquivados, senão filtrar por
    // um dia passado (cujos pedidos já foram arquivados) não traz nada.
    const consultaHistorico = !!(appliedRange.startDate || appliedRange.endDate);
    const active = allOrders.filter(o =>
      (consultaHistorico || !o.archived_at) && !['Arquivado', 'archived'].includes(o.status)
    );
    return {
      novos:              active.filter(o => ['pending', 'Pendente'].includes(o.status)),
      emPreparo:          active.filter(o => ['accepted', 'Aceito', 'preparing', 'Preparando'].includes(o.status)),
      prontos:            active.filter(o => ['ready', 'Pronto'].includes(o.status)),
      aguardandoRetirada: active.filter(o => ['accepted_by_delivery', 'Aguardando Retirada'].includes(o.status)),
      saiuParaEntrega:    active.filter(o => ['delivering', 'Saiu para Entrega', 'Entregando'].includes(o.status)),
      entregues:          active.filter(o => ['delivered', 'Entregue'].includes(o.status)),
    };
  }, [allOrders, appliedRange]);

  const hasNewOrders = newOrderIds.size > 0;

  // Props comuns das colunas. Col vive FORA da página (ver comentário lá em
  // cima), então tudo que ela usa chega por prop.
  const colProps = {
    hasNewOrders, newOrderIds, isOwnDelivery,
    onUpdateStatus: handleUpdateStatus,
    onAcceptOrder: handleAcceptOrder,
    onViewDetails: handleViewOrderDetails,
    onConfirmPickup: handleOpenPickupModal,
    onConfirmDelivery: handleOpenDeliveryModal,
    onRemove: handleRemoveOrder,
    onPrint: handlePrintOrder,
  };

  // Alarme sonoro de novo pedido MOVIDO pro PortalLayout (hook useNewOrderAlarm):
  // agora toca em QUALQUER tela do painel enquanto houver pedido novo, não só
  // aqui na tela Pedidos. Aqui ficaria mudo assim que trocasse de aba.


  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full flex flex-col bg-gray-50">
      {/* Dia I — Inksa Social (só aparece quando habilitado no admin) */}
      <SocialDayBanner />
      {/* Faixa de anúncio/aviso do parceiro (só aparece se houver banner audience=parceiro) */}
      <SponsoredStrip />
      {/* Loja escondida da vitrine por falta de cardápio. Fica ANTES do painel
          porque é a informação mais importante da tela pra quem está nessa
          situação: não adianta olhar pedidos se nenhum cliente te vê. */}
      <AvisoCardapioVazio />
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

      {/* Avisos de ocorrência de entrega (quer devolução? / confirmar devolução) */}
      <IncidentAlerts />

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
              <button onClick={handleApplyFilters} disabled={applying}
                className={`flex-1 py-2 px-4 text-sm font-semibold rounded-lg text-white transition-colors min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-70 ${
                  filterApplied ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}>
                {applying ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Aplicando...
                  </>
                ) : filterApplied ? '✓ Filtro aplicado' : 'Aplicar'}
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
            <Col {...colProps}
              bg="bg-blue-50" emoji="📥" title="Novos" count={columns.novos.length}
              textColor="text-blue-700" badgeColor="bg-blue-200"
              orders={columns.novos} isNewCol
            />
            <Col {...colProps}
              bg="bg-orange-50" emoji="👨‍🍳" title="Preparando" count={columns.emPreparo.length}
              textColor="text-orange-700" badgeColor="bg-orange-200"
              orders={columns.emPreparo}
            />
            <Col {...colProps}
              bg="bg-yellow-50" emoji="📦" title="Prontos" count={columns.prontos.length}
              textColor="text-yellow-700" badgeColor="bg-yellow-200"
              orders={columns.prontos}
            />
            <Col {...colProps}
              bg="bg-pink-50" emoji="⏳" title="Aguardando" count={columns.aguardandoRetirada.length}
              textColor="text-pink-700" badgeColor="bg-pink-200"
              orders={columns.aguardandoRetirada}
            />
            <Col {...colProps}
              bg="bg-purple-50" emoji="🚗" title="Em Rota" count={columns.saiuParaEntrega.length}
              textColor="text-purple-700" badgeColor="bg-purple-200"
              orders={columns.saiuParaEntrega}
            />
            <Col {...colProps}
              bg="bg-green-50" emoji="✅" title="Entregues" count={columns.entregues.length}
              textColor="text-green-700" badgeColor="bg-green-200"
              orders={columns.entregues} showRemove
            />
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {isModalOpen && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          restaurantName={profile?.restaurant_name || ''}
          onClose={handleCloseModal}
        />
      )}
      {showPickupModal && selectedOrderForPickup && (
        <PickupConfirmationModal
          order={selectedOrderForPickup}
          isOpen={showPickupModal}
          onClose={handleClosePickupModal}
          onSuccess={handlePickupSuccess}
        />
      )}
      {orderForDelivery && (
        <DeliveryConfirmationModal
          order={orderForDelivery}
          isOpen={!!orderForDelivery}
          onClose={() => setOrderForDelivery(null)}
          onSuccess={handleDeliverySuccess}
        />
      )}

      {/* ── Avaliar entregador + cliente após a retirada ────────────────────────
          Depois que o entregador retira o pedido, oferece ao parceiro avaliar o
          ENTREGADOR (que está ali na hora) e o CLIENTE, em sequência (reviewStep).
          "Deixar para depois" não perde nada: o pedido segue na Central de
          Avaliações. Na entrega própria não há entregador Inksa → só o cliente. */}
      {pendingReviewOrder && (() => {
        const hasDeliveryStep = !!pendingReviewOrder.delivery_id;
        const closeReview = () => { setPendingReviewOrder(null); setShowReviewForm(false); setReviewStep('delivery'); };
        const onDeliveryDone = () => {
          addToast('success', 'Avaliação do entregador enviada! 🙌');
          if (pendingReviewOrder.client_id) setReviewStep('client');
          else closeReview();
        };
        const onClientDone = () => {
          addToast('success', 'Avaliação enviada! Obrigado 🙌');
          closeReview();
        };
        const onDeliveryStep = reviewStep === 'delivery' && hasDeliveryStep;
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeReview} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            {!showReviewForm ? (
              <div className="text-center">
                <div className="text-5xl mb-2">⭐</div>
                <h3 className="text-xl font-bold text-gray-800">Avaliar {hasDeliveryStep ? 'entregador e cliente' : 'o cliente'}?</h3>
                <p className="text-sm text-gray-500 mt-1 mb-5">
                  Pedido de <span className="font-semibold text-gray-700">{pendingReviewOrder.client_name || pendingReviewOrder.client_first_name || 'o cliente'}</span> saiu para entrega. Que tal deixar uma avaliação rápida?
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Star className="h-4 w-4" />
                    Avaliar agora
                  </button>
                  <button
                    onClick={closeReview}
                    className="w-full py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Deixar para depois
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Star className="h-5 w-5 text-purple-600" />
                    {onDeliveryStep ? 'Avaliar entregador' : 'Avaliar cliente'}
                    {hasDeliveryStep && (
                      <span className="text-xs font-medium text-gray-400">{onDeliveryStep ? '1/2' : '2/2'}</span>
                    )}
                  </h3>
                  <button
                    onClick={closeReview}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                {onDeliveryStep ? (
                  <DeliveryReviewForm
                    deliverymanId={pendingReviewOrder.delivery_id}
                    orderId={pendingReviewOrder.id}
                    onSuccess={onDeliveryDone}
                  />
                ) : (
                  <ClientReviewForm
                    clientId={pendingReviewOrder.client_id}
                    orderId={pendingReviewOrder.id}
                    onSuccess={onClientDone}
                  />
                )}
              </>
            )}
          </div>
        </div>
        );
      })()}
    </div>
  );
}
