// Arquivo: src/services/authService.js (VERSÃO FINAL E CORRIGIDA)

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
        // ✅ CORREÇÃO 1: URL ajustado para a rota correta do perfil do restaurante.
        const response = await fetch(`${API_BASE_URL}/restaurant/profile`, { 
            headers: createAuthHeaders() 
        });
        // ✅ CORREÇÃO 2: Retorna a resposta completa para a página tratar.
        return processResponse(response);
    },

    /**
     * Atualiza o perfil do restaurante.
     */
    updateProfile: async (profileData) => {
        // ✅ CORREÇÃO 3: URL ajustado para a rota correta.
        const response = await fetch(`${API_BASE_URL}/restaurant/profile`, {
            method: 'PUT',
            headers: { ...createAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData),
        });
        // ✅ CORREÇÃO 4: Retorna a resposta completa.
        return processResponse(response);
    },

    /**
     * Faz o upload do logo do restaurante.
     */
    uploadRestaurantLogo: async (file) => {
        const formData = new FormData();
        // O backend espera o campo 'logo', não 'file'.
        formData.append('logo', file); 
        // ✅ CORREÇÃO 5: URL ajustado para a rota correta.
        const response = await fetch(`${API_BASE_URL}/restaurant/upload-logo`, {
            method: 'POST',
            headers: createAuthHeaders(),
            body: formData,
        });
        // ✅ CORREÇÃO 6: Retorna a resposta completa.
        return processResponse(response);
    },
};