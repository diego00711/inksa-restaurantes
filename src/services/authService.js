// services/authService.js - INKSA RESTAURANTES
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://inksa-auth-flask-dev.onrender.com';
const AUTH_TOKEN_KEY = 'restaurantAuthToken';
const RESTAURANT_USER_DATA_KEY = 'restaurantUser';

const processResponse = async (response) => {
    if (response.status === 401) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(RESTAURANT_USER_DATA_KEY);
        window.location.href = '/login';
        return null;
    }
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
};

const authService = {
    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email, 
                    password,
                    user_type: 'restaurante' 
                }),
            });

            const data = await processResponse(response);
            
            if (data && data.token) {
                localStorage.setItem(AUTH_TOKEN_KEY, data.token);
                localStorage.setItem(RESTAURANT_USER_DATA_KEY, JSON.stringify(data.user));
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
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...restaurantData,
                    user_type: 'restaurante'
                }),
            });

            const data = await processResponse(response);
            
            if (data && data.token) {
                localStorage.setItem(AUTH_TOKEN_KEY, data.token);
                localStorage.setItem(RESTAURANT_USER_DATA_KEY, JSON.stringify(data.user));
                return data;
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
                await fetch(`${API_BASE_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
            }
        } catch (error) {
            console.error('Erro no logout:', error);
        } finally {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(RESTAURANT_USER_DATA_KEY);
            window.location.href = '/login';
        }
    },

    async getRestaurantDetails() {
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const response = await fetch(`${API_BASE_URL}/api/restaurant/details`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            return await processResponse(response);
        } catch (error) {
            console.error('Erro ao buscar detalhes do restaurante:', error);
            throw error;
        }
    },

    async updateRestaurant(restaurantData) {
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const response = await fetch(`${API_BASE_URL}/api/restaurant/update`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(restaurantData),
            });

            const data = await processResponse(response);
            
            if (data && data.restaurant) {
                localStorage.setItem(RESTAURANT_USER_DATA_KEY, JSON.stringify(data.restaurant));
            }
            
            return data;
        } catch (error) {
            console.error('Erro ao atualizar restaurante:', error);
            throw error;
        }
    },

    async updateOpeningHours(hours) {
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const response = await fetch(`${API_BASE_URL}/api/restaurant/hours`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ hours }),
            });

            return await processResponse(response);
        } catch (error) {
            console.error('Erro ao atualizar horário:', error);
            throw error;
        }
    },

    async toggleStatus(isOpen) {
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const response = await fetch(`${API_BASE_URL}/api/restaurant/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ is_open: isOpen }),
            });

            return await processResponse(response);
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            throw error;
        }
    },

    getToken() {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    },

    getCurrentRestaurant() {
        const restaurantStr = localStorage.getItem(RESTAURANT_USER_DATA_KEY);
        return restaurantStr ? JSON.parse(restaurantStr) : null;
    },

    isAuthenticated() {
        return !!localStorage.getItem(AUTH_TOKEN_KEY);
    }
};

export default authService;
