import { parseItensDoPedido } from './orderItems';
// Impressão do pedido (comanda) e "sumir do aparelho".
//
// IMPRIMIR: monta uma via simples de 80mm e manda pra impressora pelo próprio
// navegador (window.print). Serve tanto pra impressora térmica quanto pra uma
// folha A4 comum — não depende de app nem de driver especial.
//
// OCULTAR: some com o pedido SÓ NESTE APARELHO (localStorage). Não mexe no
// banco: o pedido continua existindo pro admin, pro cliente, pro financeiro e
// nos outros dispositivos do parceiro. É diferente de "Arquivar" (que grava
// archived_at no servidor e vale pra todo mundo).

const HIDDEN_KEY = 'inksa.parceiro.pedidosOcultos';

export function getHiddenOrderIds() {
  try {
    const arr = JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]');
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

export function hideOrderLocally(orderId) {
  const set = getHiddenOrderIds();
  set.add(String(orderId));
  try { localStorage.setItem(HIDDEN_KEY, JSON.stringify([...set])); } catch { /* storage cheio/bloqueado */ }
  return set;
}

export function unhideAllOrders() {
  try { localStorage.removeItem(HIDDEN_KEY); } catch { /* ignore */ }
  return new Set();
}

const brl = (v) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// A leitura dos itens mora em utils/orderItems.js — havia quatro cópias deste
// parser no app e uma delas estava errada, deixando o card do pedido sem itens.
// Aqui a taxa de entrega ENTRA: recibo tem que fechar com o que foi cobrado.
function parseItems(raw) {
  return parseItensDoPedido(raw, { incluirTaxa: true }).map((it) => ({
    quantidade: it.quantidade,
    nome: it.nome,
    preco: it.preco,
    // As escolhas TÊM que sair impressas. Se o cliente pede coxa com molho
    // barbecue e a comanda mostra só "Frango frito", a cozinha faz errado — e
    // o app leva a culpa por um pedido que registrou certo.
    opcoes: it.opcoes || [],
    preco_base: it.preco_base,
  }));
}

const METODOS = { cash: 'Dinheiro', pix: 'PIX', credit: 'Cartão de crédito', debit: 'Cartão de débito' };

export function printOrder(order, restaurantName = '') {
  const itens = parseItems(order?.items);
  const subtotal = Number(order?.total_amount_items ?? 0);
  const frete = Number(order?.delivery_fee ?? 0);
  const total = Number(order?.total_amount ?? 0);
  const cliente = order?.client_name || order?.client_first_name || 'Cliente';
  const quando = order?.created_at ? new Date(order.created_at).toLocaleString('pt-BR') : '';

  let endereco = order?.delivery_address;
  if (typeof endereco === 'string') { try { endereco = JSON.parse(endereco); } catch { /* texto puro */ } }
  const enderecoTxt = typeof endereco === 'object' && endereco
    ? [endereco.street, endereco.number, endereco.neighborhood, endereco.city].filter(Boolean).join(', ')
    : (endereco || '');

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Pedido ${escapeHtml(String(order?.id || '').substring(0, 8))}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body { font-family: ui-monospace, "Courier New", monospace; font-size: 12px; color: #000; margin: 0; }
  h1 { font-size: 15px; text-align: center; margin: 0 0 2px; }
  .sub { text-align: center; font-size: 11px; margin-bottom: 8px; }
  hr { border: 0; border-top: 1px dashed #000; margin: 8px 0; }
  .linha { display: flex; justify-content: space-between; gap: 8px; }
  /* O valor nunca quebra. Com nome de item comprido, o "R$" ficava numa linha
     e os centavos na outra — numa comanda impressa isso parece defeito de
     impressora, e o cliente vem perguntar. */
  .linha > span:last-child { white-space: nowrap; }
  .item { margin-bottom: 3px; }
  /* Negrito e recuado: numa bobina de 80mm em cozinha corrida, a escolha do
     cliente precisa saltar da linha do item, não se esconder nela. */
  /* Recuada e em negrito: numa bobina de 80mm em cozinha corrida, a escolha
     do cliente precisa saltar da linha do item. O padding-left desloca só o
     nome — o valor continua alinhado à direita com os outros, senão a coluna
     de preços fica torta. */
  .opcoes { margin: -1px 0 4px 0; padding-left: 12px; font-size: 11px; font-weight: bold; }
  .total { font-size: 14px; font-weight: bold; }
  .obs { border: 1px dashed #000; padding: 4px; margin-top: 6px; }
  .rodape { text-align: center; margin-top: 10px; font-size: 11px; }
</style></head>
<body>
  <h1>${escapeHtml(restaurantName || 'Inksa Delivery')}</h1>
  <div class="sub">Pedido #${escapeHtml(String(order?.id || '').substring(0, 8))}<br>${escapeHtml(quando)}</div>
  <hr>
  <div><strong>Cliente:</strong> ${escapeHtml(cliente)}</div>
  ${enderecoTxt ? `<div><strong>Entrega:</strong> ${escapeHtml(enderecoTxt)}</div>` : ''}
  <hr>
  ${itens.length
    // Item na linha de cima com o preço DELE; cada escolha na sua própria
    // linha, com o que ela somou. Sem isso o parceiro vê 52,50 e não sabe
    // quanto foi da pizza e quanto foi do adicional.
    ? itens.map((i) => (
        `<div class="item linha"><span>${i.quantidade}x ${escapeHtml(i.nome)}</span>` +
        `<span>${brl((i.opcoes?.length ? i.preco_base : i.preco) * i.quantidade)}</span></div>` +
        (i.opcoes || []).map((o) => (
          `<div class="opcoes linha"><span>+ ${escapeHtml(
            o.qtd > 1 ? `${o.qtd}x ${o.nome}` : o.nome)}</span>` +
          `<span>${o.valor > 0 ? brl(o.valor * i.quantidade) : ''}</span></div>`
        )).join('')
      )).join('')
    : '<div class="item">(sem itens detalhados)</div>'}
  <hr>
  ${subtotal ? `<div class="linha"><span>Subtotal</span><span>${brl(subtotal)}</span></div>` : ''}
  ${frete ? `<div class="linha"><span>Entrega</span><span>${brl(frete)}</span></div>` : ''}
  <div class="linha total"><span>TOTAL</span><span>${brl(total)}</span></div>
  <div class="linha"><span>Pagamento</span><span>${escapeHtml(METODOS[order?.payment_method] || order?.payment_method || '-')}</span></div>
  ${order?.notes ? `<div class="obs"><strong>Obs:</strong> ${escapeHtml(order.notes)}</div>` : ''}
  <div class="rodape">Inksa Delivery</div>
</body></html>`;

  // iframe escondido em vez de window.open: popup costuma ser bloqueado e, no
  // app (WebView), abrir aba nova nem sempre funciona.
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(frame);
  const doc = frame.contentWindow?.document;
  if (!doc) { document.body.removeChild(frame); return false; }
  doc.open(); doc.write(html); doc.close();
  frame.contentWindow.focus();
  try {
    frame.contentWindow.print();
  } catch {
    // A WebView do Android nem sempre implementa print(). Quem avisa o
    // usuário é a tela, com ehAplicativo() — aqui só não deixa estourar.
    document.body.removeChild(frame);
    return false;
  }
  // Só remove depois da caixa de impressão fechar (senão cancela o job).
  setTimeout(() => { try { document.body.removeChild(frame); } catch { /* já removido */ } }, 60000);
  return true;
}

/**
 * Está rodando DENTRO do aplicativo instalado (WebView), e não no navegador?
 *
 * Importa por um motivo só: a WebView do Android não implementa a impressão.
 * O Chrome implementa; ela não. Então o botão apertava e não acontecia
 * absolutamente nada — sem erro, sem aviso, sem impressão. A parceira conclui
 * que o sistema é quebrado, e ela está certa.
 *
 * Não dá pra detectar a falha depois de chamar print(): quando ela não existe,
 * a chamada simplesmente não faz nada e não avisa. Por isso a tela pergunta
 * ANTES e explica o caminho que funciona.
 *
 * Dois sinais porque nenhum é garantido sozinho: a ponte do Capacitor (que só
 * existe no app) e o marcador "wv" que o Android põe no user-agent da WebView.
 */
export function ehAplicativo() {
  try {
    if (window.Capacitor?.isNativePlatform?.()) return true;
    return / wv\)|; wv;/i.test(navigator.userAgent || '');
  } catch {
    return false;
  }
}

/** Endereço pra abrir no navegador quando a impressão não rola no app. */
export const ENDERECO_WEB = 'restaurante.inksadelivery.com.br';
