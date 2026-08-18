// Aviso de loja escondida da vitrine por cardápio vazio.
//
// Desde 18/08 a vitrine do cliente esconde loja sem nenhum item disponível —
// loja aberta e vazia é pior que loja fechada: o cliente entra, não acha nada
// pra pedir, e não volta.
//
// Este componente existe porque esconder CALADO seria trocar um problema por
// outro. O parceiro ficaria invisível achando que está vendendo, e a culpa
// pareceria da plataforma ("ninguém pede pelo Inksa"). O aviso é a metade que
// falta da regra.
//
// Aparece só quando é verdade e some sozinho no minuto em que o primeiro item
// entra — nada de banner permanente que a pessoa aprende a ignorar.
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Plus } from 'lucide-react';
import { menuService } from '../services/menuService';

export default function AvisoCardapioVazio() {
  // null = ainda não sei. Não mostro nada enquanto não souber: acusar a loja
  // de estar vazia antes de conferir seria pior que não avisar.
  const [vazio, setVazio] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    let vivo = true;
    (async () => {
      try {
        const itens = await menuService.getMenuItems(ctrl.signal);
        if (!vivo) return;
        const lista = Array.isArray(itens) ? itens : (itens?.data ?? []);
        const disponiveis = lista.filter((i) => i?.is_available !== false);
        setVazio(disponiveis.length === 0);
      } catch {
        // Falhou a consulta: não mostra. Um alarme falso aqui manda o parceiro
        // procurar um problema que não existe.
        if (vivo) setVazio(false);
      }
    })();
    return () => { vivo = false; ctrl.abort(); };
  }, []);

  if (!vazio) return null;

  return (
    <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-amber-900">
            Sua loja ainda não aparece para os clientes
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Falta cadastrar o cardápio. Enquanto não houver nenhum item
            disponível, sua loja fica fora da vitrine — assim ninguém entra e
            encontra a loja vazia. Cadastre o primeiro prato e ela aparece na
            hora, sem precisar avisar ninguém.
          </p>
          <Link
            to="/cardapio"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" /> Cadastrar meu cardápio
          </Link>
        </div>
      </div>
    </div>
  );
}
