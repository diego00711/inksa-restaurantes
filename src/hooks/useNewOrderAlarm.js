import { useEffect, useState } from 'react';
import { orderService } from '../services/orderService.js';
import { useNotificationSound } from './useNotificationSound';

// Alarme de novo pedido GLOBAL do restaurante: toca em QUALQUER tela enquanto
// houver pedido em "Novos" (pendente, aguardando o restaurante aceitar). Vive no
// PortalLayout (sempre montado) — antes só tocava na tela Pedidos, então quem
// estava no Cardápio/Financeiro/etc. não ouvia o pedido chegar.
export function useNewOrderAlarm(enabled = true) {
  const playSound = useNotificationSound();
  const [hasPending, setHasPending] = useState(false);

  // Poll leve da contagem de pendentes
  useEffect(() => {
    if (!enabled) { setHasPending(false); return; }
    let alive = true;
    const check = async () => {
      try {
        const data = await orderService.getOrders(new URLSearchParams());
        const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        const pending = list.some((o) => ['pending', 'Pendente'].includes(o?.status));
        if (alive) setHasPending(pending);
      } catch {
        /* silencioso — sem net, não alarma */
      }
    };
    check();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') check();
    }, 15000);
    return () => { alive = false; clearInterval(id); };
  }, [enabled]);

  // Repete o som a cada 5s enquanto houver pedido novo (até o restaurante aceitar)
  useEffect(() => {
    if (!enabled || !hasPending) return;
    playSound('new_order');
    const id = setInterval(() => playSound('new_order'), 5000);
    return () => clearInterval(id);
  }, [enabled, hasPending, playSound]);
}

export default useNewOrderAlarm;
