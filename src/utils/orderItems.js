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
/**
 * As escolhas do cliente, já com quantidade e valor somado.
 *
 * Aceita as duas formas que o pedido pode ter: objeto (pedido novo, com nome e
 * preço gravados) e texto solto (pedidos antigos, quando só o id era gravado).
 */
export function detalharOpcoes(item) {
  if (!Array.isArray(item?.opcoes)) return [];
  return item.opcoes
    .map((o) => {
      if (typeof o === 'string') return { nome: o, qtd: 1, valor: 0 };
      const qtd = Math.max(1, Number(o?.qtd) || 1);
      return {
        nome: o?.nome || '',
        qtd,
        valor: (Number(o?.preco_extra) || 0) * qtd,
      };
    })
    .filter((o) => o.nome);
}

/** Preço do item sem as opções: o cobrado menos o que as escolhas somaram. */
export function precoBase(item) {
  const cobrado = Number(item?.unit_price ?? item?.price ?? 0) || 0;
  const extras = detalharOpcoes(item).reduce((s, o) => s + o.valor, 0);
  return Math.max(0, Number((cobrado - extras).toFixed(2)));
}

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
      // Quem pediu incluirTaxa precisa saber QUAL item é a taxa — senão teria
      // que reimplementar a regra do lado de fora, e aí ela passa a existir em
      // dois lugares. A regra mora em ehTaxaDeEntrega, ponto.
      ehTaxa: ehTaxaDeEntrega(it),
      // Escolhas do cliente (corte, molho, adicional). Só os NOMES: preço já
      // está embutido em `preco`, e repetir valor aqui é convite pra duas
      // contas divergirem.
      opcoes: detalharOpcoes(it),
      // Preço do item SEM as opções. Sai por diferença, e é de propósito:
      // unit_price é o que foi cobrado de verdade, então a base derivada dele
      // faz as linhas sempre fecharem no total — mesmo que o preço do
      // cardápio mude depois do pedido.
      preco_base: precoBase(it),
    }));
}
