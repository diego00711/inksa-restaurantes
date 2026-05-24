import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy, Star, Zap, Loader2, RefreshCw, AlertCircle,
  Medal, TrendingUp, Target, Swords, CheckCircle2, Clock, Gift,
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { RESTAURANT_API_URL, createAuthHeaders, processResponse } from '../services/api';
import { apiFetch } from '../services/apiClient';

// ─── helpers ──────────────────────────────────────────────────────────────────

const LEVEL_META = {
  1: { name: 'Bronze',  gradient: 'from-amber-600 to-amber-700',  bg: 'bg-amber-100',  text: 'text-amber-700' },
  2: { name: 'Prata',   gradient: 'from-slate-400 to-slate-500',  bg: 'bg-slate-100',  text: 'text-slate-600' },
  3: { name: 'Ouro',    gradient: 'from-yellow-400 to-yellow-500', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  4: { name: 'Platina', gradient: 'from-cyan-400 to-cyan-500',    bg: 'bg-cyan-100',   text: 'text-cyan-700'  },
  5: { name: 'Diamante',gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-100', text: 'text-purple-700'},
};

function getLevelMeta(level, levelName) {
  const meta = LEVEL_META[level] || { name: levelName || `Nível ${level}`, gradient: 'from-gray-400 to-gray-500', bg: 'bg-gray-100', text: 'text-gray-600' };
  if (levelName) meta.name = levelName;
  return meta;
}

function ProgressBar({ value, max, color = 'bg-orange-500' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className={`${color} h-2.5 rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function LevelBadge({ level, levelName }) {
  const meta = getLevelMeta(level, levelName);
  return (
    <span className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${meta.gradient} text-white px-3 py-1 rounded-full text-xs font-bold shadow`}>
      <Trophy className="h-3.5 w-3.5" />
      {meta.name}
    </span>
  );
}

function RankMedal({ position }) {
  if (position === 1) return <span className="text-yellow-500 font-extrabold text-base">🥇</span>;
  if (position === 2) return <span className="text-slate-400 font-extrabold text-base">🥈</span>;
  if (position === 3) return <span className="text-amber-600 font-extrabold text-base">🥉</span>;
  return <span className="text-slate-400 text-sm font-bold w-6 text-center">{position}</span>;
}

// ─── service layer ────────────────────────────────────────────────────────────

async function fetchJson(url) {
  const headers = createAuthHeaders();
  const res = await apiFetch(url, { headers });
  const data = await processResponse(res);
  return data?.data ?? data;
}

// ─── main component ───────────────────────────────────────────────────────────

export default function RestaurantGamificationPage() {
  const { profile, loading: profileLoading } = useProfile();

  const [stats, setStats]           = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [goals, setGoals]           = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [lbTab, setLbTab]           = useState('orders'); // 'orders' | 'rating'

  // rewards
  const [rewards, setRewards]               = useState([]);
  const [rewardsLoading, setRewardsLoading] = useState(true);
  const [rewardsError, setRewardsError]     = useState(null);
  const [confirmReward, setConfirmReward]   = useState(null);
  const [redeeming, setRedeeming]           = useState(null);
  const [redeemMsg, setRedeemMsg]           = useState(null); // {type:'success'|'error', text}

  const restaurantId = profile?.id;

  const fetchAll = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    setError(null);
    try {
      const base = RESTAURANT_API_URL;

      const [statsData, lbData, challengesActive, challengesUser] = await Promise.allSettled([
        fetchJson(`${base}/api/gamification/user-points/${restaurantId}`),
        fetchJson(`${base}/api/gamification/leaderboard?type=restaurants`),
        fetchJson(`${base}/api/challenges/active?user_type=restaurant`),
        fetchJson(`${base}/api/challenges/user/${restaurantId}`),
      ]);

      if (statsData.status === 'fulfilled') setStats(statsData.value);
      if (lbData.status === 'fulfilled') {
        const lb = lbData.value;
        setLeaderboard(Array.isArray(lb) ? lb : []);
      }

      // goals come from statsData.monthly_goals or as a separate field
      if (statsData.status === 'fulfilled' && Array.isArray(statsData.value?.monthly_goals)) {
        setGoals(statsData.value.monthly_goals);
      }

      // merge active challenges with user progress
      const active  = challengesActive.status  === 'fulfilled' ? (challengesActive.value  ?? []) : [];
      const userCh  = challengesUser.status    === 'fulfilled' ? (challengesUser.value    ?? []) : [];

      const activeArr  = Array.isArray(active) ? active : [];
      const userArr    = Array.isArray(userCh)  ? userCh  : [];

      // Build a progress map keyed by challenge id
      const progressMap = {};
      userArr.forEach(c => {
        const key = c.challenge_id ?? c.id;
        progressMap[key] = c;
      });

      // Prefer user-specific entries (have progress data), supplement with active list
      const merged = activeArr.map(ch => ({
        ...ch,
        ...(progressMap[ch.id] || {}),
      }));

      // Also add user challenges not yet in active list
      userArr.forEach(uc => {
        const id = uc.challenge_id ?? uc.id;
        if (!merged.find(m => m.id === id)) {
          merged.push({ ...uc, id });
        }
      });

      setChallenges(merged);

      // fetch rewards
      try {
        const rewardsRes = await apiFetch(
          `${base}/api/gamification/rewards?audience=restaurant`,
          { headers: createAuthHeaders() }
        );
        const rewardsData = await processResponse(rewardsRes);
        const rewardsList = rewardsData?.items ?? rewardsData?.data?.items ?? rewardsData?.data ?? [];
        setRewards(Array.isArray(rewardsList) ? rewardsList : []);
      } catch {
        setRewardsError('Não foi possível carregar recompensas.');
      } finally {
        setRewardsLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Falha ao carregar gamificação.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  const handleRedeemRequest = (reward) => {
    const cost = reward.points_required ?? 0;
    if ((stats?.total_points ?? 0) < cost) {
      setRedeemMsg({ type: 'error', text: `Pontos insuficientes. Você tem ${(stats?.total_points ?? 0).toLocaleString('pt-BR')} pts, precisa de ${cost.toLocaleString('pt-BR')} pts.` });
      setTimeout(() => setRedeemMsg(null), 4000);
      return;
    }
    setConfirmReward(reward);
  };

  const handleRedeemConfirm = async () => {
    if (!confirmReward || !restaurantId) return;
    const reward = confirmReward;
    setConfirmReward(null);
    setRedeeming(reward.id);
    const cost = reward.points_required ?? 0;
    const restaurantName = profile?.restaurant_name ?? profile?.name ?? '';
    try {
      const res = await apiFetch(`${RESTAURANT_API_URL}/api/gamification/rewards/${reward.id}/redeem`, {
        method: 'POST',
        headers: { ...createAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: restaurantId, user_type: 'restaurant', user_name: restaurantName, points_used: cost }),
      });
      const data = await processResponse(res);
      setRedeemMsg({ type: 'success', text: data?.message ?? `"${reward.name}" resgatado com sucesso!` });
      setTimeout(() => setRedeemMsg(null), 5000);
      fetchAll();
    } catch (err) {
      setRedeemMsg({ type: 'error', text: err.message || 'Erro ao resgatar recompensa.' });
      setTimeout(() => setRedeemMsg(null), 4000);
    } finally {
      setRedeeming(null);
    }
  };

  useEffect(() => {
    if (!profileLoading && restaurantId) fetchAll();
    else if (!profileLoading) setLoading(false);
  }, [profileLoading, restaurantId, fetchAll]);

  // ── derived ────────────────────────────────────────────────────────────────

  const myRankOrders = leaderboard.findIndex(r =>
    String(r.user_id ?? r.restaurant_id ?? r.id) === String(restaurantId)
  ) + 1;

  const leaderboardByRating = [...leaderboard].sort(
    (a, b) => (Number(b.average_rating ?? b.rating ?? 0)) - (Number(a.average_rating ?? a.rating ?? 0))
  );

  const currentLbList = lbTab === 'orders' ? leaderboard : leaderboardByRating;

  // ── loading / error states ─────────────────────────────────────────────────

  if (loading || profileLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-800">Gamificação</h1>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-800 mb-6">Gamificação</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <h3 className="text-lg font-semibold text-red-800">Erro ao carregar dados</h3>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAll}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // ── main render ────────────────────────────────────────────────────────────

  const levelMeta = stats ? getLevelMeta(stats.current_level, stats.level_name) : null;
  const totalPts  = stats?.total_points ?? 0;
  const toNext    = stats?.points_to_next_level ?? null;
  const pctToNext = toNext != null && toNext > 0
    ? Math.min((totalPts / (totalPts + toNext)) * 100, 100)
    : toNext === 0 ? 100 : null;

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-800">Gamificação</h1>
          <p className="text-gray-600 text-sm sm:text-base">Acompanhe seus pontos, ranking e conquistas</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors min-h-[44px] w-full sm:w-auto justify-center"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* ── 1. Pontos, Nível e Ranking ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">

        {/* Pontos Totais */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pontos Totais</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {totalPts.toLocaleString('pt-BR')}
              </p>
              {pctToNext != null && toNext != null && (
                <p className="text-xs text-gray-400 mt-1">
                  {toNext > 0 ? `Faltam ${toNext.toLocaleString('pt-BR')} pts` : 'Nível máximo!'}
                </p>
              )}
            </div>
            <Zap className="h-12 w-12 text-orange-300" />
          </div>
          {pctToNext != null && (
            <div className="mt-3">
              <ProgressBar value={pctToNext} max={100} color="bg-orange-500" />
              <p className="text-xs text-gray-400 mt-1">Progresso para o próximo nível</p>
            </div>
          )}
        </div>

        {/* Nível Atual */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Nível Atual</p>
              {stats ? (
                <>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">
                    {levelMeta?.name ?? `Nível ${stats.current_level}`}
                  </p>
                  <div className="mt-2">
                    <LevelBadge level={stats.current_level} levelName={stats.level_name} />
                  </div>
                </>
              ) : (
                <p className="text-3xl font-bold text-gray-300 mt-1">—</p>
              )}
            </div>
            <Trophy className="h-12 w-12 text-yellow-300" />
          </div>
        </div>

        {/* Posição no Ranking */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Posição no Ranking</p>
              <p className="text-3xl font-bold text-indigo-600 mt-1">
                {myRankOrders > 0 ? `#${myRankOrders}` : '—'}
              </p>
              {myRankOrders > 0 && (
                <p className="text-xs text-gray-400 mt-1">entre {leaderboard.length} restaurantes</p>
              )}
            </div>
            <Medal className="h-12 w-12 text-indigo-300" />
          </div>
        </div>
      </div>

      {/* ── 2. Ranking de Restaurantes ──────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Ranking de Restaurantes</h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-200">
          <button
            onClick={() => setLbTab('orders')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              lbTab === 'orders'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Por Pedidos
          </button>
          <button
            onClick={() => setLbTab('rating')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              lbTab === 'rating'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Por Avaliação
          </button>
        </div>

        {currentLbList.length === 0 ? (
          <div className="text-center py-10">
            <Trophy className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <p className="text-gray-500">Nenhum dado de ranking disponível.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {currentLbList.slice(0, 10).map((entry, idx) => {
              const entryId = String(entry.user_id ?? entry.restaurant_id ?? entry.id ?? '');
              const isMe    = entryId === String(restaurantId);
              const name    = entry.restaurant_name ?? entry.name ?? `Restaurante ${idx + 1}`;
              const orders  = Number(entry.total_orders ?? entry.orders_count ?? entry.pedidos ?? 0);
              const rating  = Number(entry.average_rating ?? entry.rating ?? 0);
              const pts     = Number(entry.total_points ?? entry.points ?? 0);

              return (
                <div
                  key={entryId || idx}
                  className={`flex items-center gap-3 px-2 py-3 rounded-lg ${
                    isMe ? 'bg-orange-50 ring-1 ring-orange-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 flex items-center justify-center shrink-0">
                    <RankMedal position={idx + 1} />
                  </div>

                  <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                    {name}
                    {isMe && (
                      <span className="ml-2 text-xs text-orange-600 font-semibold bg-orange-100 px-1.5 py-0.5 rounded-full">
                        você
                      </span>
                    )}
                  </span>

                  {lbTab === 'orders' ? (
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-800">{orders.toLocaleString('pt-BR')}</p>
                      <p className="text-xs text-gray-400">pedidos</p>
                    </div>
                  ) : (
                    <div className="text-right shrink-0 flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <p className="text-sm font-bold text-gray-800">
                        {rating > 0 ? rating.toFixed(1) : '—'}
                      </p>
                    </div>
                  )}

                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-xs font-semibold text-indigo-600">{pts.toLocaleString('pt-BR')} pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 3. Metas Mensais ────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Metas Mensais</h2>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-10">
            <Target className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <p className="text-gray-500">Nenhuma meta disponível no momento.</p>
            <p className="text-sm text-gray-400 mt-1">Continue recebendo pedidos para desbloquear metas!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal, idx) => {
              const current  = Number(goal.current_value ?? goal.current ?? 0);
              const target   = Number(goal.target_value  ?? goal.target  ?? 1);
              const pct      = Math.min((current / target) * 100, 100);
              const done     = pct >= 100;
              const reward   = goal.reward_points ?? goal.reward ?? null;
              const title    = goal.title ?? goal.name ?? `Meta ${idx + 1}`;
              const desc     = goal.description ?? null;

              return (
                <div
                  key={goal.id ?? idx}
                  className={`rounded-lg border p-4 ${done ? 'border-green-200 bg-green-50' : 'border-gray-100'}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {done
                        ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        : <Target className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                      }
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{title}</p>
                        {desc && <p className="text-xs text-gray-500">{desc}</p>}
                      </div>
                    </div>
                    {reward != null && (
                      <span className="shrink-0 text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        +{reward} pts
                      </span>
                    )}
                  </div>

                  <ProgressBar value={current} max={target} color={done ? 'bg-green-500' : 'bg-orange-500'} />

                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-gray-500">
                      {current.toLocaleString('pt-BR')} / {target.toLocaleString('pt-BR')}
                    </span>
                    <span className={`text-xs font-semibold ${done ? 'text-green-600' : 'text-orange-600'}`}>
                      {done ? 'Concluída!' : `${Math.round(pct)}%`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 4. Loja de Recompensas ──────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="h-5 w-5 text-green-500" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Loja de Recompensas</h2>
        </div>

        {/* Inline toast */}
        {redeemMsg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
            redeemMsg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {redeemMsg.text}
          </div>
        )}

        {rewardsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin h-8 w-8 text-green-400" />
          </div>
        ) : rewardsError ? (
          <p className="text-center text-red-500 text-sm py-6">{rewardsError}</p>
        ) : rewards.length === 0 ? (
          <div className="text-center py-10">
            <Gift className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <p className="text-gray-500">Nenhuma recompensa disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rewards.map((r) => {
              const cost      = r.points_required ?? 0;
              const myPts     = stats?.total_points ?? 0;
              const canAfford = myPts >= cost;
              const progress  = cost > 0 ? Math.min(100, Math.round((myPts / cost) * 100)) : 100;
              const isEmoji   = r.icon && !/^https?:\/\//.test(r.icon);
              const lowStock  = r.stock != null && r.stock < 10;
              const isLoading = redeeming === r.id;

              const TYPE_LABELS = { gift: 'Brinde', discount_pct: 'Desconto', free_delivery: 'Frete Grátis', credit: 'Crédito' };
              const TYPE_COLORS = { gift: 'bg-purple-100 text-purple-700', discount_pct: 'bg-green-100 text-green-700', free_delivery: 'bg-blue-100 text-blue-700', credit: 'bg-amber-100 text-amber-700' };

              return (
                <div
                  key={r.id}
                  className={`border rounded-xl p-4 flex flex-col gap-3 transition-all hover:shadow-md ${
                    canAfford ? 'border-green-200 bg-green-50/30' : 'border-gray-100'
                  }`}
                >
                  {/* Icon + name */}
                  <div className="flex items-start gap-3">
                    {r.icon ? (
                      isEmoji
                        ? <span className="text-4xl leading-none shrink-0">{r.icon}</span>
                        : <img src={r.icon} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                        <Gift className="h-6 w-6 text-green-500" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800">{r.name}</p>
                      {r.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {r.reward_type && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[r.reward_type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABELS[r.reward_type] ?? r.reward_type}
                      </span>
                    )}
                    {lowStock && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                        Estoque: {r.stock}
                      </span>
                    )}
                  </div>

                  {/* Points + progress */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`flex items-center gap-1 text-sm font-bold ${canAfford ? 'text-green-700' : 'text-gray-500'}`}>
                        ⭐ {cost.toLocaleString('pt-BR')} pts
                      </span>
                      <span className="text-xs text-gray-400">{progress}%</span>
                    </div>
                    <ProgressBar value={progress} max={100} color={canAfford ? 'bg-green-500' : 'bg-orange-400'} />
                    {!canAfford && (
                      <p className="text-xs text-gray-400 mt-1">
                        Faltam {(cost - myPts).toLocaleString('pt-BR')} pontos
                      </p>
                    )}
                  </div>

                  {/* Button */}
                  <button
                    onClick={() => !isLoading && handleRedeemRequest(r)}
                    disabled={isLoading}
                    className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 min-h-[44px] ${
                      canAfford && !isLoading
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isLoading ? 'Resgatando...' : canAfford ? 'Resgatar' : 'Pontos insuficientes'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 5. Desafios Ativos ──────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Swords className="h-5 w-5 text-indigo-500" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Desafios Ativos</h2>
        </div>

        {challenges.length === 0 ? (
          <div className="text-center py-10">
            <Swords className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <p className="text-gray-500">Nenhum desafio ativo no momento.</p>
            <p className="text-sm text-gray-400 mt-1">Novos desafios aparecem periodicamente!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {challenges.map((ch, idx) => {
              const current  = Number(ch.current_value ?? ch.progress ?? ch.current ?? 0);
              const target   = Number(ch.target_value  ?? ch.target   ?? ch.goal    ?? 1);
              const pct      = Math.min((current / target) * 100, 100);
              const done     = pct >= 100 || ch.completed || ch.status === 'completed';
              const reward   = ch.reward_points ?? ch.points_reward ?? ch.reward ?? null;
              const title    = ch.title ?? ch.name ?? `Desafio ${idx + 1}`;
              const desc     = ch.description ?? null;
              const deadline = ch.deadline ?? ch.expires_at ?? ch.end_date ?? null;

              let deadlineLabel = null;
              if (deadline) {
                try {
                  const d = new Date(deadline);
                  const diff = Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24));
                  deadlineLabel = diff > 0 ? `${diff}d restante${diff !== 1 ? 's' : ''}` : 'Expirado';
                } catch {
                  deadlineLabel = null;
                }
              }

              return (
                <div
                  key={ch.id ?? idx}
                  className={`rounded-lg border p-4 ${
                    done
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {done
                        ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        : <Swords className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                      }
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{title}</p>
                        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
                      </div>
                    </div>
                    {reward != null && (
                      <span className="shrink-0 text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        +{reward} pts
                      </span>
                    )}
                  </div>

                  <ProgressBar value={current} max={target} color={done ? 'bg-green-500' : 'bg-indigo-500'} />

                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-gray-500">
                      {current.toLocaleString('pt-BR')} / {target.toLocaleString('pt-BR')}
                    </span>
                    <div className="flex items-center gap-2">
                      {deadlineLabel && !done && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {deadlineLabel}
                        </span>
                      )}
                      <span className={`text-xs font-semibold ${done ? 'text-green-600' : 'text-indigo-600'}`}>
                        {done ? 'Concluído!' : `${Math.round(pct)}%`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {confirmReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="text-5xl mb-3">
              {confirmReward.icon && !/^https?:\/\//.test(confirmReward.icon) ? confirmReward.icon : '🎁'}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{confirmReward.name}</h3>
            <p className="text-sm text-gray-500 mb-4">
              Você usará{' '}
              <span className="font-bold text-orange-500">
                {(confirmReward.points_required ?? 0).toLocaleString('pt-BR')} pontos
              </span>{' '}
              para resgatar esta recompensa.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmReward(null)}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleRedeemConfirm}
                className="flex-1 px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
