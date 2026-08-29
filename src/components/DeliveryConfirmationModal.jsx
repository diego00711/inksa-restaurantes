// src/components/DeliveryConfirmationModal.jsx
// Entrega própria: o restaurante fecha o pedido com o código de 6 números que o
// CLIENTE mostra no app dele. Antes o restaurante marcava "entregue" direto —
// o motoboy dizia que entregou e não sobrava prova nenhuma pra conferir.

import React, { useState } from 'react';
import { X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { numeroPedido } from '../utils/pedidoNumero';

// Motivos prontos: escrever à mão no celular, no meio do expediente, ninguém
// faz — e aí a saída vira sempre a mesma frase vazia.
const MOTIVOS = [
  'Cliente não estava no local',
  'Entreguei para outra pessoa (porteiro/vizinho)',
  'Cliente não achou o código no app',
  'Cliente recusou informar o código',
];

export function DeliveryConfirmationModal({ order, isOpen, onClose, onSuccess }) {
  const [codigo, setCodigo] = useState('');
  const [semCodigo, setSemCodigo] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const { addToast } = useToast();

  if (!isOpen || !order) return null;

  const fechar = () => {
    setCodigo('');
    setSemCodigo(false);
    setMotivo('');
    setErro('');
    onClose();
  };

  const confirmar = async (e) => {
    e.preventDefault();
    setErro('');

    const corpo = {};
    if (semCodigo) {
      if (!motivo) {
        setErro('Escolha o motivo de não ter o código.');
        return;
      }
      corpo.no_code_reason = motivo;
    } else {
      if (codigo.trim().length !== 6) {
        setErro('O código do cliente tem 6 números.');
        return;
      }
      corpo.delivery_code = codigo.toUpperCase().trim();
    }

    setEnviando(true);
    try {
      await api.post(`/api/orders/${order.id}/complete`, corpo);
      addToast(
        'success',
        semCodigo ? 'Entrega registrada sem código.' : 'Entrega confirmada!',
      );
      fechar();
      onSuccess?.();
    } catch (err) {
      const msg =
        err?.response?.data?.error || err?.message || 'Não foi possível confirmar a entrega';
      setErro(msg);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-bold text-lg text-gray-800">Confirmar entrega</h2>
          <button onClick={fechar} className="p-2 text-gray-400 hover:text-gray-700" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={confirmar} className="p-4 space-y-4">
          <p className="text-sm text-gray-600">
            Pedido <span className="font-mono font-semibold">{numeroPedido(order)}</span>
            {' — '}peça ao cliente o <strong>código de entrega</strong> que aparece no app dele.
          </p>

          {!semCodigo ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código do cliente
                </label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoFocus
                  inputMode="text"
                  autoCapitalize="characters"
                  placeholder="A1B2"
                  className="w-full border-2 border-gray-300 rounded-xl px-3 py-3 text-center text-2xl font-mono font-bold tracking-[0.4em] uppercase focus:border-green-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-900">
                <ShieldCheck size={18} className="shrink-0 mt-0.5" />
                <p>O código é a prova de que o pedido chegou ao cliente.</p>
              </div>

              <button
                type="button"
                onClick={() => setSemCodigo(true)}
                className="w-full text-sm text-gray-500 underline underline-offset-2 py-2"
              >
                Não consegui o código do cliente
              </button>
            </>
          ) : (
            <>
              <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <p>
                  O pedido vai ficar marcado como <strong>entregue sem confirmação do
                  cliente</strong> — e aparece assim no card.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">O que aconteceu?</label>
                {MOTIVOS.map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMotivo(m)}
                    className={`w-full text-left text-sm px-3 py-3 rounded-lg border transition-colors ${
                      motivo === m
                        ? 'border-orange-500 bg-orange-50 text-orange-800 font-semibold'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => { setSemCodigo(false); setMotivo(''); setErro(''); }}
                className="w-full text-sm text-gray-500 underline underline-offset-2 py-2"
              >
                Voltar e digitar o código
              </button>
            </>
          )}

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {erro}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={fechar}
              className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className={`flex-1 py-3 rounded-lg text-white font-semibold disabled:opacity-60 ${
                semCodigo ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {enviando ? 'Confirmando...' : semCodigo ? 'Registrar mesmo assim' : 'Confirmar entrega'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeliveryConfirmationModal;
