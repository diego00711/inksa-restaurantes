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
    // ⚠️ SEM A TRAVA DE ABA VISÍVEL.
    //
    // Estava `if (document.visibilityState === 'visible') check()`. Com a aba
    // escondida — que é EXATAMENTE quando o alarme importa, porque a pessoa
    // está olhando outra coisa — o app nem perguntava se tinha pedido novo.
    // Não é que o som falhava: ele nunca chegava a existir, porque nada tinha
    // descoberto o pedido.
    //
    // Descoberto em 29/08/2026, quando o Diego deixou o WhatsApp por cima da
    // aba do parceiro justamente pra testar o som.
    //
    // Sobre o custo: navegador atrasa temporizador de aba escondida. O primeiro
    // ciclo pode demorar mais que 15s — mas assim que o alarme toca, a aba vira
    // "audível" e o navegador para de atrasar. Alarme atrasado é ruim; alarme
    // que nunca dispara é inútil.
    const id = setInterval(check, 15000);
    // Voltou pra aba: confere na hora, sem esperar o próximo ciclo.
    const aoVoltar = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', aoVoltar);
    };
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
