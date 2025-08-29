// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// 1. Cria o Contexto
const AuthContext = createContext(null);

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

    // Função para fazer logout
    const logout = useCallback(() => {
        localStorage.removeItem('restaurantUser');
        localStorage.removeItem('restaurantAuthToken');
        setUser(null);
        setToken(null);
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
