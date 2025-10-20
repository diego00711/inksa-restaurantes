// src/services/authService.js - VERSÃO CORRIGIDA COM LOGOUT QUE FECHA RESTAURANTE

import { 
  RESTAURANT_API_URL, 
  AUTH_API_URL, 
  processResponse, 
  createAuthHeaders,
  AUTH_TOKEN_KEY,
  USER_DATA_KEY
} from './api';

const AUTH_BASE = AUTH_API_URL || RESTAURANT_API_URL;
const RESTAURANT_BASE = RESTAURANT_API_URL || AUTH_API_URL;

export const authService = {
  login: async (email, password) => {
    try {
      const response = await fetch(`${AUTH_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const processedResponse = await processResponse(response);

      if (processedResponse && processedResponse.data && processedResponse.data.token) {
        return processedResponse.data;
      }
      throw new Error("Resposta de login inválida do servidor.");
    } catch (error) {
      console.error('Falha no serviço de login:', error);
      throw error;
    }
  },

  /**
   * Busca o perfil do restaurante logado.
   */
  getProfile: async () => {
    try {
      const response = await fetch(`${RESTAURANT_BASE}/api/restaurant/profile`, {
        headers: createAuthHeaders(),
      });
      return processResponse(response);
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      throw error;
    }
  },

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

  uploadRestaurantLogo: async (logoFile) => {
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await fetch(`${RESTAURANT_BASE}/api/restaurant/upload-logo`, {
        method: 'POST',
        headers: createAuthHeaders(),
        body: formData,
      });
      return processResponse(response);
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error);
      throw error;
    }
  },

  // ✅ MÉTODO LOGOUT CORRIGIDO - AGORA CHAMA O BACKEND!
  logout: async () => {
    try {
      // 1️⃣ Pega o token ANTES de limpar (precisamos dele para autenticar)
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      
      if (token) {
        // 2️⃣ Chama o backend para fechar o restaurante automaticamente
        try {
          await fetch(`${AUTH_BASE}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          console.log('✅ Logout no backend realizado com sucesso!');
        } catch (backendError) {
          // Se falhar no backend, continua o logout local mesmo assim
          console.warn('⚠️ Erro ao chamar logout no backend:', backendError);
        }
      }
      
      // 3️⃣ Limpa o localStorage (sempre executa, mesmo se backend falhar)
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      
      // 4️⃣ Redireciona para login
      window.location.href = '/login';
      
    } catch (error) {
      console.error("❌ Erro durante o processo de logout:", error);
      // Em caso de erro crítico, força limpeza e redirecionamento
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      window.location.href = '/login';
    }
  },
};

export default authService;
