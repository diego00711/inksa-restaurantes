// src/services/authService.js - VERSÃO CORRIGIDA

import { 
  RESTAURANT_API_URL, 
  AUTH_API_URL, 
  processResponse, 
  createAuthHeaders,
  AUTH_TOKEN_KEY,
  USER_DATA_KEY
} from './api';

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
      
      const processedResponse = await processResponse(response);

      // ✅ CORREÇÃO: Verifica se a resposta tem a estrutura { data: {...} }
      // e retorna apenas o conteúdo de 'data'.
      if (processedResponse && processedResponse.data) {
        return processedResponse.data; 
      }

      // Se a resposta não tiver o formato esperado, lança um erro.
      throw new Error("Resposta de login inválida do servidor.");

    } catch (error) {
      console.error('Falha no login:', error);
      // Re-lança o erro para que o componente que chamou a função possa tratá-lo.
      throw error;
    }
  },

  /**
   * Busca o perfil do usuário autenticado.
   * GET /api/auth/profile
   */
  getProfile: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: createAuthHeaders(),
      });
      
      // A função processResponse já retorna o JSON, que agora será { status, data }
      return processResponse(response);
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      throw error;
    }
  },

  /**
   * Realiza o logout do usuário no frontend.
   */
  logout: () => {
    try {
      console.log("Realizando logout...");
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      window.location.replace('/login');
    } catch (error) {
      console.error("Erro durante o processo de logout:", error);
      window.location.href = '/login';
    }
  },

  // Adicione aqui outras funções do seu authService se houver
};

export default authService;
