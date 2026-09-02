// src/components/MeuLinkDaLoja.jsx
//
// O LINK QUE O PARCEIRO COLA NA BIO DO INSTAGRAM.
//
// Existe porque a rota pública por loja já funcionava há tempos e ninguém
// usava: o endereço era /restaurantes/<uuid>, e ninguém cola 36 caracteres
// de UUID numa bio. O apelido resolveu o endereço; este bloco resolve o
// resto — dar o link pronto na mão de quem precisa dele.
//
// Por que isso importa mais do que parece: em 01/09/2026, os quatro
// comércios prospectados em Lages (Espetinhos da Serra, Cheese Americano,
// Marmitaria Krause, Samuca Salgados) usavam o link da bio para receber
// pedido — linktree, wa.link, WhatsApp. O parceiro tem audiência e a Inksa
// não: o Samuca tem 2.491 seguidores, o Espetinhos 5.180, e a Inksa 995.
// Cada link colado é um funil da audiência DELE para dentro da plataforma.
import { useState } from 'react';
import { Copy, Check, Instagram, ChevronDown } from 'lucide-react';

const BASE = 'https://clientes.inksadelivery.com.br';

export default function MeuLinkDaLoja({ slug, nomeDaLoja }) {
  const [copiado, setCopiado] = useState(null); // 'link' | 'texto' | null
  // Fechado por padrão: quem já sabe usar não precisa rolar por cima do
  // passo a passo toda vez que abre Configurações.
  const [comoUsar, setComoUsar] = useState(false);

  // Sem apelido não há link — e mostrar um link quebrado é pior que não
  // mostrar nada. Acontece só em loja recém-criada, até o perfil salvar.
  if (!slug) return null;

  const link = `${BASE}/${slug}`;
  const textoBio =
    `📲 Peça pelo app: ${link.replace('https://', '')}`;

  const copiar = async (valor, qual) => {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(qual);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      // Navegador antigo ou permissão negada: seleciona pra pessoa copiar
      // na mão, em vez de o botão não fazer nada e parecer quebrado.
      window.prompt('Copie o link:', valor);
    }
  };

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Instagram className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-gray-900">Seu link para o Instagram</h3>
          <p className="text-sm text-gray-600 mt-1">
            Coloque na bio do seu perfil. Quem clicar cai direto no seu cardápio,
            já dentro do app — sem precisar procurar sua loja.
          </p>

          <div className="mt-3 flex items-center gap-2 rounded-lg bg-white border border-orange-200 px-3 py-2">
            {/* Sem truncate: em tela de celular o link cabia como
                "clientes.inksadelive…" e escondia exatamente o pedaço que é do
                parceiro. Ele precisa VER o próprio apelido — é o que faz o
                link parecer dele. Então quebra em duas linhas e o apelido vem
                destacado. */}
            <span className="font-mono text-xs sm:text-sm break-all flex-1 min-w-0 leading-snug">
              <span className="text-gray-500">{BASE.replace('https://', '')}/</span>
              <span className="text-gray-900 font-semibold">{slug}</span>
            </span>
            <button
              type="button"
              onClick={() => copiar(link, 'link')}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-white text-sm font-semibold hover:bg-orange-600 min-h-[36px]"
            >
              {copiado === 'link'
                ? (<><Check className="h-4 w-4" /> Copiado</>)
                : (<><Copy className="h-4 w-4" /> Copiar</>)}
            </button>
          </div>

          {/* O texto pronto poupa o parceiro de inventar a frase — e é o que
              faz a diferença entre ele copiar agora ou "depois". */}
          <button
            type="button"
            onClick={() => copiar(textoBio, 'texto')}
            className="mt-2 text-sm text-primary font-semibold hover:underline"
          >
            {copiado === 'texto'
              ? '✓ Texto copiado'
              : 'Copiar com uma frase pronta para a bio'}
          </button>

          {/* O PASSO A PASSO.
              A versão anterior deste bloco só dizia "coloque na bio" — o que
              serve para quem já sabe. Os comércios que a gente prospecta em
              Lages são donos de espetinho, marmitaria, salgaderia: dizer ONDE
              tocar dentro do Instagram é o que separa "faço depois" de "fiz
              agora". Não custa nada a quem já sabe, porque nasce fechado. */}
          <button
            type="button"
            onClick={() => setComoUsar((v) => !v)}
            aria-expanded={comoUsar}
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900 min-h-[36px]"
          >
            Como usar
            <ChevronDown
              className={`h-4 w-4 transition-transform ${comoUsar ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {comoUsar && (
            <ol className="mt-1 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="shrink-0 font-bold text-primary">1.</span>
                <span>Toque em <strong>Copiar</strong> aqui em cima.</span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-bold text-primary">2.</span>
                <span>
                  No Instagram, abra seu perfil e toque em{' '}
                  <strong>Editar perfil</strong>. Cole no campo{' '}
                  <strong>Links</strong> (em celular mais antigo aparece como{' '}
                  <strong>Site</strong>) e salve.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-bold text-primary">3.</span>
                <span>
                  Pronto. Quem tocar no link da sua bio cai direto no seu
                  cardápio, com o carrinho pronto para fechar o pedido.
                </span>
              </li>
              {/* Vale dizer: é o motivo de existir a api/preview.js. O parceiro
                  precisa saber que, ao mandar o link, aparece a marca DELE. */}
              <li className="flex gap-2 pt-1 border-t border-orange-200">
                <span className="shrink-0" aria-hidden="true">💬</span>
                <span className="text-gray-600">
                  Funciona no WhatsApp também: ao mandar o link para um cliente
                  ou num grupo, aparece o nome e a foto{' '}
                  {nomeDaLoja ? <>da <strong>{nomeDaLoja}</strong></> : <>da <strong>sua loja</strong></>}
                  {' '}— não a da Inksa.
                </span>
              </li>
            </ol>
          )}

          <p className="mt-3 text-xs text-gray-500">
            {nomeDaLoja
              ? `Este link é só da ${nomeDaLoja}. `
              : 'Este link é só da sua loja. '}
            Ele continua funcionando mesmo para quem ainda não tem conta no app.
          </p>
        </div>
      </div>
    </div>
  );
}
