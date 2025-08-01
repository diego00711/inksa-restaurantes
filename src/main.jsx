// src/main.jsx - CONFIRME ESTE CÓDIGO (COM O IMPORT DO CSS)

import './index.css' // CRÍTICO: DEVE SER A PRIMEIRA IMPORTAÇÃO DE ARQUIVO
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)