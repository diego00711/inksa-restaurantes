import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Calendar, TrendingUp, AlertTriangle, Pencil } from 'lucide-react';
import { RESTAURANT_API_URL, AUTH_TOKEN_KEY } from '../services/api';
import { useProfile } from '../context/ProfileContext';

const fmt = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export default function FinancePage() {
  const { profile } = useProfile();

  const [summary, setSummary] = useState({ balance: null, nextPayout: null, monthTotal: null, pendingCount: 0 });
  const [payouts, setPayouts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchPayouts = async () => {
      setLoadingData(true);
      try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const res = await fetch(`${RESTAURANT_API_URL}/api/restaurant/payouts`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setSummary({
            balance: data.a_receber ?? data.balance ?? null,
            nextPayout: data.next_payout_date ?? null,
            monthTotal: data.month_total ?? null,
            pendingCount: data.pendente_pedidos_count ?? 0,
          });
          setPayouts(Array.isArray(data.payouts) ? data.payouts : []);
        }
      } catch {
        // API indisponível — mantém placeholders
      } finally {
        setLoadingData(false);
      }
    };
    fetchPayouts();
  }, []);

  const statusBadge = (status) => {
    const map = {
      paid: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
    };
    const label = { paid: 'Pago', pending: 'Pendente', processing: 'Processando' };
    const cls = map[status] || 'bg-gray-100 text-gray-600';
    return (
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cls}`}>
        {label[status] || status}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-800">Financeiro</h1>
        <p className="text-gray-500 text-sm sm:text-base mt-1">Acompanhe seus repasses e configure o recebimento</p>
      </div>

      {/* Summary Cards — contam a história do dinheiro: A Receber → quando cai → Recebido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* A Receber — já inclui os pedidos entregues que ainda não viraram repasse */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br from-orange-500 to-amber-500 p-6 text-white">
          <DollarSign className="absolute -top-3 -right-3 h-24 w-24 opacity-20" />
          <div className="relative">
            <div className="inline-flex p-2 rounded-xl bg-white/20 mb-3"><DollarSign className="h-5 w-5" /></div>
            <p className="text-sm font-medium text-white/90">A Receber</p>
            <p className="text-3xl font-black mt-1 break-words">
              {loadingData ? '...' : summary.balance !== null ? fmt(summary.balance) : '--'}
            </p>
            <p className="text-xs text-white/80 mt-1">
              {summary.pendingCount > 0
                ? `de ${summary.pendingCount} pedido${summary.pendingCount > 1 ? 's' : ''} entregue${summary.pendingCount > 1 ? 's' : ''}`
                : 'tudo repassado 🎉'}
            </p>
          </div>
        </div>

        {/* Próximo Repasse — responde "quando cai?" */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white">
          <Calendar className="absolute -top-3 -right-3 h-24 w-24 opacity-20" />
          <div className="relative">
            <div className="inline-flex p-2 rounded-xl bg-white/20 mb-3"><Calendar className="h-5 w-5" /></div>
            <p className="text-sm font-medium text-white/90">Próximo Repasse</p>
            <p className="text-2xl font-black mt-1">
              {loadingData ? '...' : summary.nextPayout
                ? new Date(summary.nextPayout).toLocaleDateString('pt-BR')
                : 'Toda semana'}
            </p>
            <p className="text-xs text-white/80 mt-1">
              {summary.nextPayout ? 'data prevista do repasse' : 'os repasses caem toda semana'}
            </p>
          </div>
        </div>

        {/* Recebido — o que já caiu na conta */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white">
          <TrendingUp className="absolute -top-3 -right-3 h-24 w-24 opacity-20" />
          <div className="relative">
            <div className="inline-flex p-2 rounded-xl bg-white/20 mb-3"><TrendingUp className="h-5 w-5" /></div>
            <p className="text-sm font-medium text-white/90">Recebido no mês</p>
            <p className="text-3xl font-black mt-1 break-words">
              {loadingData ? '...' : summary.monthTotal !== null ? fmt(summary.monthTotal) : '--'}
            </p>
            <p className="text-xs text-white/80 mt-1">já caiu na sua conta</p>
          </div>
        </div>
      </div>

      {/* PIX Key Section — somente leitura: a chave é configurada em Configurações
          (fonte única; evita ter o mesmo dado editável em duas telas diferentes) */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 sm:mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Chave PIX para Recebimento</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 border border-gray-200 bg-gray-50 rounded-lg px-4 py-2 text-sm text-gray-700 min-h-[44px] flex items-center">
            {profile?.pix_key ? profile.pix_key : <span className="text-gray-400">Nenhuma chave PIX cadastrada</span>}
          </div>
          <Link
            to="/configuracoes"
            className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] font-medium"
          >
            <Pencil className="h-4 w-4" />
            {profile?.pix_key ? 'Alterar' : 'Cadastrar'}
          </Link>
        </div>
      </div>

      {/* Payout History Table */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 sm:mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Histórico de Repasses</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Valor</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Referência</th>
              </tr>
            </thead>
            <tbody>
              {payouts.length > 0 ? (
                payouts.map((payout, idx) => (
                  <tr
                    key={payout.id || idx}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-4 py-3 text-gray-700">
                      {payout.date
                        ? new Date(payout.date).toLocaleDateString('pt-BR')
                        : '--'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-700">
                      {fmt(payout.amount)}
                    </td>
                    <td className="px-4 py-3">{statusBadge(payout.status)}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {payout.reference || '--'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                    {loadingData ? 'Carregando...' : 'Nenhum repasse encontrado'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          O <strong>A Receber</strong> já soma seus pedidos entregues (valor líquido, depois da comissão).
          Toda semana esse saldo é fechado e cai na sua chave PIX automaticamente. Dúvidas? Fale com o suporte Inksa.
        </p>
      </div>
    </div>
  );
}
