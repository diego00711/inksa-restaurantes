// Avisos de OCORRÊNCIA de entrega pro restaurante: quando um pedido dele não é
// entregue e o bot pergunta se ele quer a devolução, aparece aqui. Se ele quiser
// de volta, confirma o recebimento digitando o código que o entregador mostra
// (anti-golpe). Se não quiser, manda descartar. Some sozinho quando resolve.
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2, RotateCcw, Trash2, CheckCircle2 } from 'lucide-react';
import { orderService } from '../services/orderService.js';
import { useToast } from '../context/ToastContext.jsx';

const REASON_LABELS = {
  customer_not_found: 'Cliente não localizado',
  wrong_address: 'Endereço errado/incompleto',
  customer_refused: 'Cliente recusou o pedido',
  customer_absent: 'Ninguém para receber',
  courier_issue: 'Problema do entregador',
  courier_damaged: 'Entregador derrubou/danificou',
  payment_issue: 'Problema no pagamento',
};

function IncidentCard({ inc, onChanged }) {
  const { addToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');

  const decide = async (wantReturn) => {
    setBusy(true);
    try {
      await orderService.decideIncidentReturn(inc.order_id, wantReturn);
      addToast('success', wantReturn ? 'Ok! O entregador vai trazer o pedido de volta.' : 'Ok! O entregador vai descartar o pedido.');
      onChanged();
    } catch (e) {
      addToast('error', e?.response?.data?.error || e?.message || 'Erro ao responder.');
    } finally { setBusy(false); }
  };

  const confirmReturn = async () => {
    const c = code.trim().toUpperCase();
    if (c.length < 3) { addToast('error', 'Digite o código de devolução que o entregador está mostrando.'); return; }
    setBusy(true);
    try {
      await orderService.confirmIncidentReturn(inc.order_id, c);
      addToast('success', 'Devolução confirmada! Obrigado.');
      onChanged();
    } catch (e) {
      addToast('error', e?.response?.data?.error || e?.message || 'Código inválido.');
    } finally { setBusy(false); }
  };

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="font-bold text-amber-900 text-sm">
          Pedido #{inc.order_ref} — problema na entrega
        </p>
      </div>
      <p className="text-xs text-amber-800 mb-3">
        Motivo: {REASON_LABELS[inc.reason] || inc.reason}
      </p>

      {inc.outcome === 'awaiting_restaurant' ? (
        <>
          <p className="text-sm font-medium text-gray-800 mb-2">Você quer que o entregador traga o pedido de volta?</p>
          <div className="flex gap-2">
            <button
              onClick={() => decide(true)} disabled={busy}
              className="flex-1 min-h-[44px] py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-1.5"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Sim, quero de volta
            </button>
            <button
              onClick={() => decide(false)} disabled={busy}
              className="flex-1 min-h-[44px] py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> Não, pode descartar
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-gray-800 mb-2">
            Quando o entregador chegar, digite o <b>código de devolução</b> que ele vai mostrar:
          </p>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex.: AB12"
              maxLength={6}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-center text-base font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={confirmReturn} disabled={busy}
              className="min-h-[44px] px-4 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Confirmar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function IncidentAlerts() {
  const [incidents, setIncidents] = useState([]);
  const aliveRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const data = await orderService.getMyIncidents();
      if (aliveRef.current) setIncidents(Array.isArray(data) ? data : []);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    load();
    const id = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 20000);
    return () => { aliveRef.current = false; clearInterval(id); };
  }, [load]);

  if (!incidents.length) return null;

  return (
    <div className="mb-4 space-y-2">
      {incidents.map((inc) => (
        <IncidentCard key={inc.id} inc={inc} onChanged={load} />
      ))}
    </div>
  );
}
