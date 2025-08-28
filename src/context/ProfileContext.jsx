// src/services/authService.js
// Serviço de autenticação do Portal do Restaurante

import { RESTAURANT_API_URL, AUTH_API_URL, processResponse, createAuthHeaders } from './api';

// Constante para definir de onde vêm as requisições de autenticação
// Se AUTH_API_URL não estiver definido, use o RESTAURANT_API_URL como fallback
const API_BASE = AUTH_API_URL || RESTAURANT_API_URL;

export const authService = {
  /**
   * Realiza login do restaurante.
   * POST /api/auth/login
   */
  login: async (credentials) => {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return processResponse(response);
  },

  /**
   * Realiza o cadastro de um novo restaurante.
   * POST /api/auth/register
   */
  register: async (restaurantData) => {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(restaurantData),
    });
    return processResponse(response);
  },

  /**
   * Realiza logout do usuário atual.
   * POST /api/auth/logout
   */
  logout: async () => {
    const response = await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: createAuthHeaders(),
    });
    return processResponse(response);
  },

  /**
   * Solicita redefinição de senha.
   * POST /api/auth/forgot-password
   */
  forgotPassword: async (email) => {
    const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    return processResponse(response);
  },

  /**
   * Redefine a senha com o token recebido.
   * POST /api/auth/reset-password
   */
  resetPassword: async (token, newPassword) => {
    const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password: newPassword }),
    });
    return processResponse(response);
  },

  /**
   * Verifica se o token atual é válido.
   * GET /api/auth/validate-token
   */
  validateToken: async () => {
    const response = await fetch(`${API_BASE}/api/auth/validate-token`, {
      headers: createAuthHeaders(),
    });
    return processResponse(response);
  },

  /**
   * Obtém o perfil do restaurante autenticado.
   * GET /api/auth/profile
   */
  getProfile: async () => {
    try {
      // Recupera o ID do restaurante do localStorage
      const userDataStr = localStorage.getItem('restaurantUser');
      let restaurantId;
      
      try {
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          restaurantId = userData.id;
        }
      } catch (err) {
        console.error('Erro ao obter ID do restaurante:', err);
      }
      
      // Adiciona o ID do restaurante como parâmetro de consulta
      const url = new URL(`${API_BASE}/api/auth/profile`);
      if (restaurantId) {
        url.searchParams.append('restaurant_id', restaurantId);
      }
      
      const response = await fetch(url.toString(), {
        headers: createAuthHeaders(),
      });
      
      return processResponse(response);
    } catch (error) {
      console.error('Erro ao buscar perfil do restaurante:', error);
      throw error;
    }
  },

  /**
   * Atualiza o perfil do restaurante.
   * PUT /api/auth/profile
   */
  updateProfile: async (profileData) => {
    const response = await fetch(`${API_BASE}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...createAuthHeaders(),
      },
      body: JSON.stringify(profileData),
    });
    return processResponse(response);
  },

  /**
   * Atualiza a senha do usuário autenticado.
   * PUT /api/auth/change-password
   */
  changePassword: async (currentPassword, newPassword) => {
    const response = await fetch(`${API_BASE}/api/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...createAuthHeaders(),
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });
    return processResponse(response);
  },
};

export default authService;
