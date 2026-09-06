// src/main.jsx - CONFIRME ESTE CÓDIGO (COM O IMPORT DO CSS)

import './index.css' // CRÍTICO: DEVE SER A PRIMEIRA IMPORTAÇÃO DE ARQUIVO
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { ConfirmProvider } from './components/ConfirmProvider.jsx'
import { iniciarAutoAtualizacao } from './utils/autoAtualiza'


// TELA BRANCA DEPOIS DE DEPLOY — a causa, medida em produção em 05/09/2026:
// o host devolve o index.html (HTTP 200, content-type text/html) para
// QUALQUER caminho, inclusive /assets/*. Então uma aba que ficou aberta antes
// do deploy pede o chunk antigo da rota, recebe HTML no lugar de JavaScript, o
// browser recusa executar como módulo, o import dinâmico rejeita — e a tela
// fica BRANCA, sem erro visível pra ninguém.
//
// Foi exatamente isso no /cardapio do parceiro: a rota está na lista de
// rotasSensiveis logo abaixo (certo: recarregar por cima de um item sendo
// digitado apagaria o trabalho dele), então o auto-atualiza não recarregou, o
// chunk envelheceu junto com a aba, e o clique em "Cardápio" apagou a tela.
//
// Recarrega UMA vez pra pegar o index novo, com trava de tempo pra nunca virar
// loop. Vale inclusive nas rotas sensíveis: aqui o dado já se perdeu de
// qualquer jeito — a escolha é entre voltar funcionando e ficar no branco.
window.addEventListener('vite:preloadError', () => {
  const last = Number(sessionStorage.getItem('preloadErrReloadAt')) || 0;
  if (Date.now() - last < 10000) return;
  sessionStorage.setItem('preloadErrReloadAt', String(Date.now()));
  window.location.reload();
});

// Pega a versao nova sem o usuario ter que fechar e abrir o app.
// So recarrega ao voltar pro app depois de um tempo fora, e nunca nas
// telas abaixo, onde recarregar apagaria o que a pessoa esta fazendo.
iniciarAutoAtualizacao({ rotasSensiveis: ['cardapio', 'categorias', 'cupons', 'configuracoes', 'register', 'reset-password'] });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfirmProvider>
        <App />
      </ConfirmProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

// SW so em producao: em dev ele intercepta fetches e atrapalha depuracao
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}