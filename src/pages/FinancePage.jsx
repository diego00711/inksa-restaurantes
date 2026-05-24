import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, TrendingUp, AlertTriangle, Save } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { RESTAURANT_API_URL, AUTH_TOKEN_KEY } from '../services/api';

const PIX_KEY_STORAGE = 'restaurant_pix_key';

const fmt = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export default function FinancePage() {
  const { addToast } = useToast();

  const [pixKey, setPixKey] = useState(() => localStorage.getItem(PIX_KEY_STORAGE) || '');
  const [savingPix, setSavingPix] = useState(false);

  const [summary, setSummary] = useState({ balance: null, nextPayout: null, monthTotal: null });
  const [payouts, setPayouts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchPayouts = async () => {
      setLoadingData(true);
      try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const res = await fetch(`${RESTAURANT_API_URL}/api/admin/payouts`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setSummary({
            balance: data.balance ?? null,
            nextPayout: data.next_payout_date ?? null,
            monthTotal: data.month_total ?? null,
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

  const handleSavePix = () => {
    setSavingPix(true);
    setTimeout(() => {
      localStorage.setItem(PIX_KEY_STORAGE, pixKey);
      addToast('success', 'Chave PIX salva com sucesso!');
      setSavingPix(false);
    }, 400);
  };

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Saldo a Receber</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {loadingData ? '...' : summary.balance !== null ? fmt(summary.balance) : '--'}
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-orange-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Próximo Repasse</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {loadingData ? '...' : summary.nextPayout
                  ? new Date(summary.nextPayout).toLocaleDateString('pt-BR')
                  : 'A definir'}
              </p>
            </div>
            <Calendar className="h-12 w-12 text-blue-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Recebido (mês)</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {loadingData ? '...' : summary.monthTotal !== null ? fmt(summary.monthTotal) : '--'}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-300" />
          </div>
        </div>
      </div>

      {/* PIX Key Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 sm:mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Chave PIX para Recebimento</h2>
        <p className="text-sm text-gray-500 mb-4">
          Informe sua chave PIX para receber os repasses. Pode ser CPF, CNPJ, e-mail, telefone ou chave aleatória.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            placeholder="Ex: 00.000.000/0001-00 ou email@exemplo.com"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 min-h-[44px]"
          />
          <button
            onClick={handleSavePix}
            disabled={savingPix || !pixKey.trim()}
            className="flex items-center justify-center gap-2 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 min-h-[44px] font-medium"
          >
            <Save className="h-4 w-4" />
            {savingPix ? 'Salvando...' : 'Salvar'}
          </button>
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
          Os repasses são processados automaticamente. Para dúvidas entre em contato com o suporte Inksa.
        </p>
      </div>
    </div>
  );
}
