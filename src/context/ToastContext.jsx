// src/context/ToastContext.jsx (VERSÃO FINAL E CORRETA)

import React, { createContext, useState, useCallback, useContext } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const ToastContext = createContext(null);

// Hook customizado para usar o ToastContext
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) { // Verifique por undefined, não null, é mais seguro para useContext
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
};

// Componente Provider
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // removeToast precisa ser definido primeiro ou estar no useCallback de addToast
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []); // Esta dependência vazia está ok para removeToast

  const addToast = useCallback((type, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id); // Chama removeToast
    }, 5000);
  }, [removeToast]); // ✅ CORREÇÃO AQUI: 'removeToast' é uma dependência de 'addToast'

  const toastConfig = {
    success: { icon: <CheckCircle size={20} />, bg: 'bg-green-500' },
    error: { icon: <XCircle size={20} />, bg: 'bg-red-500' },
    warning: { icon: <AlertTriangle size={20} />, bg: 'bg-yellow-500' },
    info: { icon: <Info size={20} />, bg: 'bg-blue-500' },
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        className="fixed z-[100] left-4 right-4 sm:left-auto sm:right-5 flex flex-col items-stretch sm:items-end gap-3"
        style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        {toasts.map(toast => {
          const config = toastConfig[toast.type] || toastConfig.info;
          return (
            <div key={toast.id} className={`${config.bg} text-white py-3 px-5 rounded-lg shadow-xl flex items-center gap-3 animate-fade-in-right w-full sm:w-auto sm:max-w-sm`}>
              <span className="shrink-0">{config.icon}</span>
              <span className="flex-1 min-w-0 break-words">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="shrink-0 text-white hover:opacity-75">
                <XCircle size={18} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};