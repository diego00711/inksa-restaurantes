// src/services/authService.js - VERSÃO FINAL CORRIGIDA

import { 
  RESTAURANT_API_URL, 
  AUTH_API_URL, 
  processResponse, 
  createAuthHeaders,
  AUTH_TOKEN_KEY,
  USER_DATA_KEY
} from './api';

// A API de autenticação é usada para login/perfil, mas a de restaurante para updates.
const AUTH_BASE = AUTH_API_URL || RESTAURANT_API_URL;
const RESTAURANT_BASE = RESTAURANT_API_URL || AUTH_API_URL;

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
      
      const response = await fetch(`${AUTH_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue, password: passwordValue }),
      });
      
      const processedResponse = await processResponse(response);

      if (processedResponse && processedResponse.data) {
        return processedResponse.data; 
      }

      throw new Error("Resposta de login inválida do servidor.");

    } catch (error) {
      console.error('Falha no login:', error);
      throw error;
    }
  },

  /**
   * Busca o perfil do usuário autenticado.
   * GET /api/auth/profile
   */
  getProfile: async () => {
    try {
      const response = await fetch(`${AUTH_BASE}/api/auth/profile`, {
        headers: createAuthHeaders(),
      });
      return processResponse(response);
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      throw error;
    }
  },

  /**
   * ✅ NOVO: Atualiza o perfil do restaurante.
   * PUT /api/restaurant/profile
   */
  updateProfile: async (profileData) => {
    try {
      const response = await fetch(`${RESTAURANT_BASE}/api/restaurant/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...createAuthHeaders(),
        },
        body: JSON.stringify(profileData),
      });
      return processResponse(response);
    } catch (error) {
      console.error('Erro ao atualizar o perfil:', error);
      throw error;
    }
  },

  /**
   * ✅ NOVO: Faz upload do logo do restaurante.
   * POST /api/restaurant/upload-logo
   */
  uploadRestaurantLogo: async (logoFile) => {
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await fetch(`${RESTAURANT_BASE}/api/restaurant/upload-logo`, {
        method: 'POST',
        headers: {
          // 'Content-Type' é definido automaticamente pelo navegador para FormData
          ...createAuthHeaders(), 
        },
        body: formData,
      });
      return processResponse(response);
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error);
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
};

export default authService;
