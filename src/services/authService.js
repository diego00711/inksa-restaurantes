// Arquivo: src/services/authService.js (VERSÃO FINAL COM GAMIFICAÇÃO)

import { API_BASE_URL, AUTH_TOKEN_KEY, USER_DATA_KEY, processResponse, createAuthHeaders } from './api';

export const authService = {
    /**
     * Regista um novo utilizador.
     */
    register: async (userData) => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        return processResponse(response);
    },

    /**
     * Tenta fazer o login do utilizador.
     */
    login: async (email, password) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, user_type: 'restaurant' }),
        });
        const data = await processResponse(response);
        if (data && data.access_token) {
            localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
            if (data.data && data.data.user) {
                localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.data.user));
            }
        }
        return data;
    },

    /**
     * Envia um pedido de recuperação de senha.
     */
    forgotPassword: async (email) => {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        return processResponse(response);
    },

    /**
     * Faz o logout do utilizador.
     */
    logout: () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        window.location.href = '/login';
    },

    /**
     * Verifica se o utilizador está autenticado.
     */
    isAuthenticated: () => !!localStorage.getItem(AUTH_TOKEN_KEY),

    /**
     * Obtém os dados do utilizador guardados.
     */
    getUser: () => {
        const user = localStorage.getItem(USER_DATA_KEY);
        return user ? JSON.parse(user) : null;
    },
    
    /**
     * Busca o perfil do restaurante no backend.
     */
    getProfile: async () => {
        const response = await fetch(`${API_BASE_URL}/restaurant/profile`, { 
            headers: createAuthHeaders() 
        });
        return processResponse(response);
    },

    /**
     * Atualiza o perfil do restaurante.
     */
    updateProfile: async (profileData) => {
        const response = await fetch(`${API_BASE_URL}/restaurant/profile`, {
            method: 'PUT',
            headers: { ...createAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData),
        });
        return processResponse(response);
    },

    /**
     * Faz o upload do logo do restaurante.
     */
    uploadRestaurantLogo: async (file) => {
        const formData = new FormData();
        formData.append('logo', file); 
        const response = await fetch(`${API_BASE_URL}/restaurant/upload-logo`, {
            method: 'POST',
            headers: createAuthHeaders(),
            body: formData,
        });
        return processResponse(response);
    },

    // --- NOVAS FUNÇÕES DE GAMIFICAÇÃO ---

    /**
     * Busca os pontos e o nível de um usuário.
     */
    getGamificationStats: async (userId) => {
        const response = await fetch(`${API_BASE_URL}/gamification/${userId}/points-level`, {
            headers: createAuthHeaders()
        });
        return processResponse(response);
    },

    /**
     * Busca as conquistas (badges) de um usuário.
     */
    getUserBadges: async (userId) => {
        const response = await fetch(`${API_BASE_URL}/gamification/${userId}/badges`, {
            headers: createAuthHeaders()
        });
        return processResponse(response);
    },

    /**
     * Busca os rankings globais, filtrados por tipo de perfil.
     */
    getGlobalRankings: async (profileType) => {
        const response = await fetch(`${API_BASE_URL}/gamification/rankings?type=${profileType}`, {
            headers: createAuthHeaders()
        });
        return processResponse(response);
    },
};