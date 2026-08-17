// src/utils/orderItems.js
// Leitura dos itens do pedido, num lugar só.
//
// POR QUE EXISTE: havia QUATRO leituras diferentes do mesmo campo neste app —
// o card do pedido, o modal de detalhes, o KDS e a impressão. Três funcionavam
// e uma não: o card fazia `order.items?.items`, esperando um objeto aninhado,
// enquanto o pedido real chega como ARRAY. Resultado: o restaurante via o
// pedido sem NENHUM item — só o valor e o nome do cliente. Ele não tinha como
// saber o que preparar.
//
// E mesmo se o formato batesse, o card lia `item.name` enquanto o app do
// cliente grava `title` — sairia "undefined" em cada linha.
//
// `orders.items` chega em três formas, todas reais: array, string JSON, ou
// objeto aninhado {items:[]}. E cada item ora usa name/price, ora
// title/unit_price. Um parser só tolera os três; quatro parsers divergem.

/** Item que é a taxa de entrega, não comida. Tem linha própria no total. */
export function ehTaxaDeEntrega(item) {
  const nome = String(item?.title || item?.name || '').trim().toLowerCase();
  // Sem menu_item_id E com nome de taxa: é a linha sintética que o checkout
  // acrescenta. Um produto de verdade chamado "frete" (existe em loja de
  // material de construção) tem menu_item_id e não cai aqui.
  return !item?.menu_item_id && (nome === 'taxa de entrega' || nome === 'frete');
}

/**
 * Normaliza os itens do pedido.
 *
 * @param raw            order.items em qualquer uma das três formas
 * @param incluirTaxa    true na impressão (é recibo, o dinheiro tem que bater);
 *                       false na cozinha e no card (ninguém prepara frete)
 * @returns [{ quantidade, nome, preco, menu_item_id }]
 */
export function parseItensDoPedido(raw, { incluirTaxa = false } = {}) {
  let dados = raw;

  if (typeof dados === 'string') {
    try { dados = JSON.parse(dados); } catch { return []; }
  }
  if (dados && !Array.isArray(dados) && Array.isArray(dados.items)) {
    dados = dados.items;
  }
  if (!Array.isArray(dados)) return [];

  return dados
    .filter((it) => incluirTaxa || !ehTaxaDeEntrega(it))
    .map((it) => ({
      quantidade: Number(it?.quantity ?? it?.qty ?? 1) || 1,
      nome: it?.title ?? it?.name ?? it?.product_name ?? 'Item',
      preco: Number(it?.unit_price ?? it?.price ?? 0) || 0,
      menu_item_id: it?.menu_item_id ?? null,
    }));
}
