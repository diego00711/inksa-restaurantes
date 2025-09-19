// src/services/api.js

import axios from 'axios';

// --- Configuração das URLs da API ---
// Define a URL base para as chamadas da API do restaurante.
// Usa a variável de ambiente VITE_RESTAURANT_API_URL, com um fallback para VITE_API_URL.
const RESTAURANT_API_URL =
  import.meta.env.VITE_RESTAURANT_API_URL ||
  import.meta.env.VITE_API_URL ||
  '';

// (Opcional) URL para o serviço de autenticação, se for separado.
const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL ||
  RESTAURANT_API_URL || // Fallback para a mesma URL do restaurante
  '';

// --- Chaves para o Local Storage ---
// Usadas para armazenar o token de autenticação e os dados do usuário.
const AUTH_TOKEN_KEY = 'restaurantAuthToken';
const USER_DATA_KEY = 'restaurantUser';

// --- Instância Centralizada do Axios ---
// Cria uma instância do axios que será usada em todo o aplicativo.
// Todas as chamadas feitas com `api.get()`, `api.post()`, etc., usarão esta configuração.
const api = axios.create({
  baseURL: RESTAURANT_API_URL, // Define a URL base para todas as requisições
});

// --- Interceptor de Requisição (Request Interceptor) ---
// Este código é executado ANTES de cada requisição ser enviada.
// É a maneira mais eficiente de adicionar o token de autenticação.
api.interceptors.request.use(
  (config) => {
    // Pega o token do localStorage
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    
    // Se o token existir, adiciona ao cabeçalho 'Authorization'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Retorna a configuração da requisição para que ela possa continuar
    return config;
  },
  (error) => {
    // Se houver um erro na configuração da requisição, ele é rejeitado
    return Promise.reject(error);
  }
);

// --- Interceptor de Resposta (Response Interceptor) ---
// Este código é executado DEPOIS que uma resposta da API é recebida.
// Ideal para tratar erros de forma centralizada, como tokens expirados (erro 401).
api.interceptors.response.use(
  // Função para respostas com sucesso (status 2xx)
  (response) => {
    // Apenas retorna a resposta se for bem-sucedida
    return response;
  },
  // Função para respostas com erro
  (error) => {
    // Verifica se o erro é de autenticação (401 - Unauthorized)
    if (error.response && error.response.status === 401) {
      // Limpa os dados de autenticação do localStorage
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      
      // Redireciona o usuário para a página de login
      // O `window.location.replace` impede que o usuário volte para a página anterior no histórico.
      window.location.replace('/login');
    }
    
    // Rejeita a promise para que o erro possa ser tratado no local da chamada (no `catch` do serviço)
    return Promise.reject(error);
  }
);

// --- Exportação Principal ---
// Exporta a instância configurada do `api` como padrão.
// É isso que permite `import api from './api';` funcionar em outros arquivos.
export default api;

// --- Exportações Nomeadas Adicionais ---
// Exporta as constantes para que possam ser usadas em outros lugares se necessário
// (por exemplo, no seu serviço de autenticação `authService.js`).
export {
  AUTH_API_URL,
  RESTAURANT_API_URL,
  AUTH_TOKEN_KEY,
  USER_DATA_KEY,
};
