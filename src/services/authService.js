// src/services/authService.js
// Serviço de autenticação do Portal do Restaurante

import {
  AUTH_API_URL,
  AUTH_TOKEN_KEY,
  USER_DATA_KEY,
  processResponse,
} from './api';

const authService = {
  async login(email, password) {
    try {
      const response = await fetch(`${AUTH_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          user_type: 'restaurante',
        }),
      });

      const data = await processResponse(response);

      if (data?.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
        return data;
      }

      throw new Error('Token não recebido');
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  },

  async register(restaurantData) {
    try {
      const response = await fetch(`${AUTH_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...restaurantData,
          user_type: 'restaurante',
        }),
      });

      const data = await processResponse(response);

      if (data?.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  },

  async logout() {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        await fetch(`${AUTH_API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      window.location.href = '/login';
    }
  },

  async forgotPassword(email) {
    try {
      const response = await fetch(`${AUTH_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      return await processResponse(response);
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      throw error;
    }
  },

  async resetPassword(token, newPassword) {
    try {
      const response = await fetch(`${AUTH_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      return await processResponse(response);
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      throw error;
    }
  },

  async updateProfile(profileData) {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const response = await fetch(`${AUTH_API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await processResponse(response);

      if (data?.user) {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  },

  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  getCurrentUser() {
    const userStr = localStorage.getItem(USER_DATA_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  },
};

// Exportações para compatibilidade
export { authService };
export default authService;
