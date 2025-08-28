// src/services/authService.js
// Serviço de autenticação do Portal do Restaurante
// Espelhado no cliente: força base absoluta + rotas /api/auth/*

import {
  AUTH_API_URL,
  AUTH_TOKEN_KEY,
  USER_DATA_KEY,
  processResponse,
} from './api';

// Use the AUTH_API_URL from environment variables, with fallback
const API_BASE_URL = AUTH_API_URL || 'https://inksa-auth-flask-dev.onrender.com';

// Debug logging for development
console.log('🔐 authService initialized with base URL:', API_BASE_URL);
if (!AUTH_API_URL) {
  console.warn('⚠️ AUTH_API_URL environment variable not set. Using fallback URL. Set VITE_AUTH_API_URL for production.');
}

const authService = {
  async login(email, password) {
    try {
      const loginUrl = `${API_BASE_URL}/api/auth/login`;
      console.log('🚀 Attempting login to:', loginUrl);
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, user_type: 'restaurante' }),
      });

      const data = await processResponse(response);

      if (data && data.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
        console.log('✅ Login successful');
        return data;
      }

      throw new Error('Token não recebido');
    } catch (error) {
      console.error('❌ Erro no login:', error);
      // Provide more specific error messages based on error type
      if (error.message === 'Failed to fetch') {
        throw new Error(`Não foi possível conectar ao servidor de autenticação. Verifique se o backend está rodando em: ${API_BASE_URL}`);
      }
      throw error;
    }
  },

  async register(restaurantData) {
    const registerUrl = `${API_BASE_URL}/api/auth/register`;
    console.log('🚀 Attempting registration to:', registerUrl);
    
    const response = await fetch(registerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...restaurantData, user_type: 'restaurante' }),
    });
    const data = await processResponse(response);
    if (data && data.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
      console.log('✅ Registration successful');
    }
    return data;
  },

  async logout() {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Erro no logout:', e);
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      window.location.href = '/login';
    }
  },

  async forgotPassword(email) {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return processResponse(response);
  },

  async resetPassword(token, newPassword) {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    return processResponse(response);
  },

  async updateProfile(profileData) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
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
  },

  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_DATA_KEY));
    } catch {
      return null;
    }
  },
  isAuthenticated() {
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  },
};

export { authService };
export default authService;
