// src/services/authService.js
// Serviço de autenticação do Portal do Restaurante
// Backend único expõe rotas SEM prefixo /api e SEM /auth no caminho (ex.: POST /login)

import {
  AUTH_API_URL,
  AUTH_TOKEN_KEY,
  USER_DATA_KEY,
  processResponse,
} from './api';

const authService = {
  async login(email, password) {
    try {
      const response = await fetch(`${AUTH_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          // user_type não é usado pelo backend, mas não atrapalha
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
      const response = await fetch(`${AUTH_API_URL}/register`, {
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
        // Se o backend ainda não tiver /logout, ignoramos erro 404
        await fetch(`${AUTH_API_URL}/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => {});
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
      // Garanta que esta rota exista no backend ou ajuste conforme necessário
      const response = await fetch(`${AUTH_API_URL}/forgot-password`, {
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
      // Garanta que esta rota exista no backend ou ajuste conforme necessário
      const response = await fetch(`${AUTH_API_URL}/reset-password`, {
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
      // Garanta que esta rota exista no backend ou ajuste conforme necessário
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const response = await fetch(`${AUTH_API_URL}/profile`, {
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
};

export default authService;
