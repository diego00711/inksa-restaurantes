// src/context/AuthContext.jsx - VERSÃO CORRIGIDA COM LOGOUT ASSÍNCRONO

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { obterTokenFCM, saveFcmToken } from '../services/notificationService';
import { RESTAURANT_API_URL } from '../services/api';

// 1. Cria o Contexto
const AuthContext = createContext(null);

/**
 * Registra o aparelho pra receber push. Idempotente.
 *
 * Roda na RETOMADA de sessão, não só no login. O parceiro deixa o painel
 * logado o dia inteiro e não desloga por semanas — com o registro só dentro
 * do LoginPage, quem já estava logado nunca era perguntado.
 */
async function registrarPush(authToken) {
    try {
        const { token, erro } = await obterTokenFCM();
        if (!token) {
            console.warn('Push: token não gerado —', erro);
            return;
        }
        const r = await saveFcmToken(token, RESTAURANT_API_URL, {
            Authorization: `Bearer ${authToken}`,
        });
        if (!r?.ok) console.warn('Push: servidor não salvou o token —', r?.motivo);
    } catch (e) {
        console.warn('Push: falha ao registrar (não bloqueia o app):', e);
    }
}

// 2. Cria o Provedor do Contexto
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Efeito para verificar a sessão no localStorage
    useEffect(() => {
        try {
            const storedToken = localStorage.getItem('restaurantAuthToken');
            const storedUser = localStorage.getItem('restaurantUser');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                registrarPush(storedToken);
            }
        } catch (error) {
            console.error("Falha ao carregar dados do localStorage", error);
            localStorage.clear();
            setUser(null);
            setToken(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Função para fazer login
    const login = useCallback((userData, authToken) => {
        localStorage.setItem('restaurantUser', JSON.stringify(userData));
        localStorage.setItem('restaurantAuthToken', authToken);
        setUser(userData);
        setToken(authToken);
    }, []);

    // ✅ Função para fazer logout - AGORA ASSÍNCRONA!
    const logout = useCallback(async () => {
        try {
            // Limpa o estado local imediatamente
            localStorage.removeItem('restaurantUser');
            localStorage.removeItem('restaurantAuthToken');
            localStorage.removeItem('restaurantRefreshToken');
            setUser(null);
            setToken(null);
            
            // Nota: O authService.logout() já faz o redirecionamento
            // então não precisamos fazer nada mais aqui
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
            // Garante que limpa mesmo se der erro
            localStorage.removeItem('restaurantUser');
            localStorage.removeItem('restaurantAuthToken');
            localStorage.removeItem('restaurantRefreshToken');
            setUser(null);
            setToken(null);
        }
    }, []);

    const value = {
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// 3. Cria e EXPORTA o Hook customizado para usar o contexto
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
}
