// src/components/OpeningHoursEditor.jsx
// Editor de horários de funcionamento semanais + opção de abrir/fechar
// automaticamente. O valor é um objeto { "mon": {enabled, open, close}, ... }.

import React from "react";

const DAYS = [
  { key: "mon", label: "Segunda" },
  { key: "tue", label: "Terça" },
  { key: "wed", label: "Quarta" },
  { key: "thu", label: "Quinta" },
  { key: "fri", label: "Sexta" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

const DEFAULT_SLOT = { enabled: false, open: "18:00", close: "23:00" };

export default function OpeningHoursEditor({ value, onChange, auto, onAutoChange }) {
  const hours = value && typeof value === "object" ? value : {};

  const updateDay = (key, patch) => {
    const next = { ...hours, [key]: { ...DEFAULT_SLOT, ...hours[key], ...patch } };
    onChange(next);
  };

  const copyToAll = (key) => {
    const src = { ...DEFAULT_SLOT, ...hours[key] };
    const next = {};
    DAYS.forEach((d) => { next[d.key] = { ...src }; });
    onChange(next);
  };

  return (
    <div className="border-t pt-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-semibold text-gray-700">Horários de Funcionamento</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <span className="text-sm font-medium text-gray-700">Abrir/fechar automaticamente</span>
          <div className="relative">
            <input type="checkbox" checked={!!auto} onChange={(e) => onAutoChange(e.target.checked)} className="sr-only" />
            <div className={`w-11 h-6 rounded-full transition-colors ${auto ? "bg-indigo-600" : "bg-gray-300"}`} />
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${auto ? "translate-x-5" : ""}`} />
          </div>
        </label>
      </div>

      {auto && (
        <p className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md p-2 mb-4">
          Com a abertura automática ligada, seu restaurante abre e fecha sozinho conforme os horários abaixo.
          O botão manual "Aberto/Fechado" passa a ser controlado pelo sistema.
        </p>
      )}

      <div className="space-y-2">
        {DAYS.map((d) => {
          const slot = { ...DEFAULT_SLOT, ...hours[d.key] };
          return (
            <div key={d.key} className="flex items-center gap-3 flex-wrap py-2 border-b border-gray-100 last:border-0">
              <label className="flex items-center gap-2 w-28 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!slot.enabled}
                  onChange={(e) => updateDay(d.key, { enabled: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">{d.label}</span>
              </label>

              {slot.enabled ? (
                <>
                  <input
                    type="time"
                    value={slot.open}
                    onChange={(e) => updateDay(d.key, { open: e.target.value })}
                    className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                  />
                  <span className="text-gray-400 text-sm">às</span>
                  <input
                    type="time"
                    value={slot.close}
                    onChange={(e) => updateDay(d.key, { close: e.target.value })}
                    className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => copyToAll(d.key)}
                    className="text-xs text-indigo-600 hover:underline ml-1"
                  >
                    aplicar a todos
                  </button>
                </>
              ) : (
                <span className="text-sm text-gray-400">Fechado</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
