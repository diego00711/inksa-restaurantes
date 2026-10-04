import React from 'react';
import { Link } from 'react-router-dom';
import { Gift, Loader2 } from 'lucide-react';
import { useRifa } from '../hooks/useRifa';

/**
 * Os números da loja na campanha.
 *
 * ⚠️ Com a campanha desligada esta tela diz que não há campanha, e o item some
 * do menu. Hoje esse é o estado normal: a campanha só liga depois da
 * autorização do sorteio.
 */

const DE_ONDE = {
  cadastro: 'por ter entrado na Inksa',
  venda: 'por uma venda',
  pedido: 'por um pedido',
  entrega: 'por uma entrega',
};

export default function RifaPage() {
  const { ligada, numeros, total, carregando } = useRifa();

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando os seus números…
      </div>
    );
  }

  if (!ligada) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <Gift className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-gray-900">Nenhuma campanha no momento</h1>
        <p className="text-gray-600 mt-2">
          Quando tiver uma promoção valendo, os números da sua loja aparecem aqui.
        </p>
        <Link to="/pedidos" className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-orange-500 text-white font-medium">
          Ir para os pedidos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-1">
        <Gift className="w-7 h-7 text-orange-500" />
        <h1 className="text-2xl font-bold text-gray-900">Os números da sua loja</h1>
      </div>
      <p className="text-gray-600 mb-6">
        A sua loja está concorrendo com{' '}
        <strong className="text-gray-900">
          {total} {total === 1 ? 'número' : 'números'}
        </strong>.
      </p>

      {total === 0 ? (
        <div className="rounded-2xl border border-gray-200 p-6 text-center">
          <p className="text-gray-700">Nenhum número ainda.</p>
          <p className="text-sm text-gray-500 mt-1">
            Eles aparecem conforme você vende pela Inksa.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
            {numeros.map((n) => (
              <div key={n.numero}
                className="rounded-xl border border-orange-200 bg-orange-50 py-3 text-center">
                <p className="text-lg font-bold text-orange-700 tabular-nums">{n.numero}</p>
                <p className="text-[11px] text-orange-800/70 leading-tight px-1">
                  {DE_ONDE[n.origem] || n.origem}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5 text-sm text-gray-700">
            <p className="font-semibold text-gray-900 mb-1">Como ganhar mais</p>
            <p>
              A cada <strong>R$ 50,00</strong> vendidos e entregues pela Inksa a sua
              loja ganha mais um número. O valor é cumulativo, e conta o preço dos
              itens — o frete fica de fora.
            </p>
            {/* Dito aqui porque é a pergunta que chega no suporte: o lojista
                soma o que vendeu COM o frete e acha que faltou número. */}
            <p className="mt-2 text-gray-600">
              Pedido cancelado ou estornado não vale, e o número que ele gerou é
              cancelado junto.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
