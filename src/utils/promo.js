// Promoção de item, do lado do parceiro.
//
// ESPELHA utils/precos.py do backend. A regra que importa é a mesma nos dois
// lados: a promoção só vale se for MENOR que o preço normal. Promoção que
// encarece fica inerte em vez de quebrar o cadastro — é a proteção contra o
// erro mais provável de digitação, que é escrever 300 no lugar de 30.
//
// Aqui isso é só DESENHO. Quem decide o que vai ser cobrado é o servidor, que
// recalcula tudo na criação do pedido. Se um dia estes dois arquivos
// discordarem, quem manda é o Python.

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

/** A promoção deste item está valendo de verdade? */
export function emPromocao(item) {
  if (item?.promo_price == null || item.promo_price === '') return false;
  const promo = num(item.promo_price);
  const base = num(item.price);
  return promo > 0 && promo < base;
}

/** Desconto em % inteiro, pro selo. 0 quando não há promoção valendo. */
export function descontoPct(item) {
  if (!emPromocao(item)) return 0;
  const base = num(item.price);
  return Math.round(((base - num(item.promo_price)) / base) * 100);
}

/** Quanto o cliente paga por este item agora. */
export function precoVigente(item) {
  return emPromocao(item) ? num(item.promo_price) : num(item?.price);
}
