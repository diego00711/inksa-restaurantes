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
import { Copy, Check, Instagram } from 'lucide-react';

const BASE = 'https://clientes.inksadelivery.com.br';

export default function MeuLinkDaLoja({ slug, nomeDaLoja }) {
  const [copiado, setCopiado] = useState(null); // 'link' | 'texto' | null

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
            <span className="font-mono text-sm text-gray-800 truncate flex-1">
              {link.replace('https://', '')}
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
