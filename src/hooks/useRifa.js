// "Existe campanha de números agora, e quantos a minha loja tem?"
//
// Gêmeo do hook do app do Cliente e do Entregador — muda só a rota. Quem
// decide se a campanha existe é o SERVIDOR: com ela desligada a resposta é
// `{ligada: false}` e some tudo, o item do menu e a tela.
//
// ⚠️ A campanha nasce desligada e só liga depois da autorização do sorteio.
// Então `ligada: false` é o estado NORMAL hoje, não erro nem falha de rede.
//
// Uma busca por sessão, guardada em memória do módulo: o menu pergunta em
// toda tela e a resposta não muda no meio do expediente.
import { useEffect, useState } from 'react';
import { RESTAURANT_API_URL, createAuthHeaders } from '../services/api';

const VAZIO = { ligada: false, numeros: [], total: 0 };

let cache = null;
let voando = null;

export function limparCacheDaRifa() {
  cache = null;
  voando = null;
}

async function buscar() {
  if (cache) return cache;
  if (voando) return voando;
  voando = (async () => {
    try {
      const r = await fetch(`${RESTAURANT_API_URL}/api/restaurant/rifa`, {
        headers: createAuthHeaders(),
      });
      if (!r.ok) return VAZIO;
      const j = await r.json();
      cache = j?.data || VAZIO;
      return cache;
    } catch {
      // Sem rede: trata como "não sei" e esconde. Errar pro lado de esconder
      // é melhor que anunciar campanha que pode não existir.
      return VAZIO;
    } finally {
      voando = null;
    }
  })();
  return voando;
}

export function useRifa() {
  const [dados, setDados] = useState(cache || VAZIO);
  const [carregando, setCarregando] = useState(!cache);

  useEffect(() => {
    let vivo = true;
    buscar().then((d) => {
      if (!vivo) return;
      setDados(d);
      setCarregando(false);
    });
    return () => { vivo = false; };
  }, []);

  return { ...dados, carregando };
}
