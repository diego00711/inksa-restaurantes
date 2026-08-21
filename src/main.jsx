// src/main.jsx - CONFIRME ESTE CÓDIGO (COM O IMPORT DO CSS)

import './index.css' // CRÍTICO: DEVE SER A PRIMEIRA IMPORTAÇÃO DE ARQUIVO
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { ConfirmProvider } from './components/ConfirmProvider.jsx'
import { iniciarAutoAtualizacao } from './utils/autoAtualiza'


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