import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Star, Zap, Loader2, RefreshCcw, AlertCircle, Medal, TrendingUp } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { RESTAURANT_API_URL, createAuthHeaders } from '../services/api';

function LevelBadge({ level, levelName }) {
  const colors = {
    1: 'from-amber-600 to-amber-700',
    2: 'from-slate-400 to-slate-500',
    3: 'from-yellow-400 to-yellow-500',
    4: 'from-cyan-400 to-cyan-500',
    5: 'from-purple-500 to-purple-600',
  };
  const color = colors[level] || 'from-gray-400 to-gray-500';
  return (
    <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${color} text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md`}>
      <Trophy className="h-4 w-4" />
      {levelName || `Nível ${level}`}
    </div>
  );
}

function ProgressBar({ value, max, color = 'bg-orange-500' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function RestaurantGamificationPage() {
  const { profile, loading: profileLoading } = useProfile();
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGamification = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError(null);
    try {
      const headers = createAuthHeaders();
      const [statsRes, lbRes] = await Promise.all([
        fetch(`${RESTAURANT_API_URL}/api/gamification/${profile.id}/points-level`, { headers }),
        fetch(`${RESTAURANT_API_URL}/api/gamification/leaderboard?scope=restaurant&limit=10`, { headers }),
      ]);
      const statsJson = statsRes.ok ? await statsRes.json() : null;
      const lbJson = lbRes.ok ? await lbRes.json() : null;
      setStats(statsJson?.data || statsJson || null);
      const lb = lbJson?.data || lbJson || [];
      setLeaderboard(Array.isArray(lb) ? lb : []);
    } catch (err) {
      setError(err.message || 'Falha ao carregar gamificação.');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!profileLoading && profile?.id) fetchGamification();
    else if (!profileLoading) setLoading(false);
  }, [profileLoading, profile?.id, fetchGamification]);

  const myRank = leaderboard.findIndex(r => String(r.user_id) === String(profile?.id)) + 1;

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">Carregando gamificação…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-8 rounded-xl border border-rose-200 bg-rose-50 p-6">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <p className="text-sm font-semibold text-rose-700">Falha ao carregar gamificação</p>
        </div>
        <p className="text-sm text-rose-600 mb-4">{error}</p>
        <button
          onClick={fetchGamification}
          className="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Gamificação</h1>
        <button
          onClick={fetchGamification}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RefreshCcw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
              <Zap className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-sm text-slate-500 font-medium">Pontos Totais</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats?.total_points?.toLocaleString('pt-BR') ?? '—'}</p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100">
              <Trophy className="h-5 w-5 text-yellow-600" />
            </div>
            <p className="text-sm text-slate-500 font-medium">Nível Atual</p>
          </div>
          {stats ? (
            <>
              <p className="text-3xl font-bold text-slate-800 mb-2">{stats.current_level}</p>
              <LevelBadge level={stats.current_level} levelName={stats.level_name} />
            </>
          ) : (
            <p className="text-3xl font-bold text-slate-400">—</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
              <Medal className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="text-sm text-slate-500 font-medium">Posição no Ranking</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">{myRank > 0 ? `#${myRank}` : '—'}</p>
        </div>
      </div>

      {/* Progress to next level */}
      {stats?.points_to_next_level != null && (
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700">Progresso para o próximo nível</p>
            <span className="text-xs text-slate-400">{stats.points_to_next_level} pts restantes</span>
          </div>
          <ProgressBar
            value={(stats.total_points || 0)}
            max={(stats.total_points || 0) + (stats.points_to_next_level || 1)}
            color="bg-orange-500"
          />
        </div>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            <h2 className="text-base font-semibold text-slate-800">Ranking de Restaurantes</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {leaderboard.map((entry, idx) => {
              const isMe = String(entry.user_id) === String(profile?.id);
              return (
                <div
                  key={entry.user_id || idx}
                  className={`flex items-center gap-4 px-5 py-3 ${isMe ? 'bg-orange-50' : 'hover:bg-slate-50/60'}`}
                >
                  <span className={`w-6 text-center text-sm font-bold ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-600' : 'text-slate-400'}`}>
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-slate-700 truncate">
                    {entry.restaurant_name || entry.name || `Restaurante ${idx + 1}`}
                    {isMe && <span className="ml-2 text-xs text-orange-600 font-semibold">(você)</span>}
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {Number(entry.total_points || 0).toLocaleString('pt-BR')} pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!stats && !error && (
        <div className="text-center py-12 text-slate-500">
          <Trophy className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm">Nenhum dado de gamificação encontrado ainda.</p>
          <p className="text-xs mt-1">Continue recebendo pedidos para acumular pontos!</p>
        </div>
      )}
    </div>
  );
}
