// src/services/authService.js - VERSÃO FINAL COM LOGOUT

import { 
  RESTAURANT_API_URL, 
  AUTH_API_URL, 
  processResponse, 
  createAuthHeaders,
  // Importando as chaves do localStorage para consistência
  AUTH_TOKEN_KEY,
  USER_DATA_KEY
} from './api';

// Usa a URL de autenticação como primária, com fallback para a URL do restaurante.
const API_BASE = AUTH_API_URL || RESTAURANT_API_URL;

export const authService = {
  /**
   * Realiza login do restaurante.
   * POST /api/auth/login
   */
  login: async (email, password) => {
    try {
      const emailValue = (typeof email === 'object' && email !== null) ? email.email : email;
      const passwordValue = (typeof email === 'object' && email !== null) ? email.password : password;

      if (!emailValue || !passwordValue) {
        throw new Error("Email e senha são obrigatórios");
      }
      
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue, password: passwordValue }),
      });
      
      // A função processResponse já lida com erros HTTP.
      return processResponse(response);

    } catch (error) {
      console.error('Erro ao realizar login:', error);
      throw error;
    }
  },

  /**
   * Busca o perfil do usuário autenticado.
   * GET /api/auth/profile
   * A API identifica o usuário pelo token, sem necessidade de parâmetros.
   */
  getProfile: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: createAuthHeaders(),
      });
      
      return processResponse(response);
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      throw error;
    }
  },

  /**
   * Realiza o logout do usuário no frontend.
   * Limpa os dados de autenticação do localStorage e redireciona para o login.
   */
  logout: () => {
    try {
      console.log("Realizando logout...");
      // 1. Remove o token e os dados do usuário do armazenamento local.
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      
      // 2. Redireciona o usuário para a página de login.
      // O 'replace' impede que o usuário volte para a página anterior (protegida) usando o botão "Voltar" do navegador.
      window.location.replace('/login');
    } catch (error) {
      console.error("Erro durante o processo de logout:", error);
      // Mesmo com erro, tenta forçar o redirecionamento.
      window.location.href = '/login';
    }
  },

  // Adicione aqui outras funções do seu authService se houver (ex: updateProfile, etc.)
};

export default authService;
