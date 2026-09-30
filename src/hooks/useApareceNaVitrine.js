// "A minha loja está aparecendo para o cliente?" — em UM lugar só.
//
// ⚠️ EXISTE PORQUE O PAINEL MENTIA, E MENTIA EM VERDE (29/09/2026).
//
// A vitrine do cliente esconde loja que não tem coordenada OU não tem nenhum
// item disponível. São dois portões, e a regra está certa: loja que aparece e
// não pode vender é pior que loja escondida.
//
// O problema era o parceiro não saber. A Premium açaí ligou o horário
// automático, o agendador abriu a loja às 13h, e o painel dela passou a mostrar
// "Aberto" em verde, com bolinha pulsando — logo acima de um aviso amarelo
// dizendo que ela não podia ficar aberta. Dois sinais contraditórios na mesma
// tela, e ela acreditou no mais concreto. Ficou esperando pedido de uma loja
// que a vitrine escondia com razão: sem endereço e sem cardápio.
//
// `is_open` responde "o balcão está atendendo". NÃO responde "o cliente me
// encontra". Quem precisa saber a segunda é o dono da loja.
//
// ⚠️ A regra também vive no backend (é ele quem monta a vitrine). Se um dos
// dois portões mudar lá, mude aqui — ou o painel volta a mentir, só que ao
// contrário.
import { useEffect, useState } from 'react';
import { menuService } from '../services/menuService';

export function useApareceNaVitrine(profile) {
  // null = ainda não sei. Enquanto não souber, NÃO acuso a loja de estar
  // escondida: alarme falso manda o parceiro procurar problema que não existe.
  const [temItem, setTemItem] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    let vivo = true;
    (async () => {
      try {
        const itens = await menuService.getMenuItems(ctrl.signal);
        if (!vivo) return;
        const lista = Array.isArray(itens) ? itens : (itens?.data ?? []);
        setTemItem(lista.some((i) => i?.is_available !== false));
      } catch {
        // Consulta falhou: assume que tem item. Errar para o lado de não
        // acusar é o certo aqui.
        if (vivo) setTemItem(true);
      }
    })();
    return () => { vivo = false; ctrl.abort(); };
  }, []);

  const temCoord =
    profile?.latitude != null && profile?.longitude != null &&
    Number.isFinite(Number(profile.latitude)) && Number.isFinite(Number(profile.longitude));

  const faltas = [];
  if (!temCoord) faltas.push('endereço com localização no mapa');
  if (temItem === false) faltas.push('pelo menos um item disponível no cardápio');

  // ⚠️ SEM PERFIL AINDA É "NÃO SEI", NÃO É "SEM ENDEREÇO".
  // Enquanto o ProfileContext carrega, `profile` é null — e null não tem
  // latitude. Sem esta linha, o aviso PISCA "sua loja não está aparecendo" em
  // todo carregamento de loja que está perfeitamente visível.
  const naoSeiAinda = !profile || temItem === null;

  return {
    // `null` = ainda não sei. Quem usa deve tratar como "não mostra nada":
    // acusar por engano manda o parceiro procurar problema que não existe.
    aparece: naoSeiAinda ? null : faltas.length === 0,
    faltas,
  };
}
