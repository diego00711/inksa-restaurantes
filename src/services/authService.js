// src/services/authService.js - VERSÃO CORRIGIDA
import { RESTAURANT_API_URL, AUTH_API_URL, processResponse, createAuthHeaders } from './api';

const API_BASE = AUTH_API_URL || RESTAURANT_API_URL;

export const authService = {
  /**
   * Realiza login do restaurante.
   * POST /api/auth/login
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   */
  login: async (email, password) => {
    try {
      // Verificando se email e password são strings ou se foram passados como objeto
      let emailValue, passwordValue;
      
      // Se email for um objeto contendo as credenciais
      if (typeof email === 'object' && email !== null) {
        emailValue = email.email;
        passwordValue = email.password;
      } else {
        // Se email e password foram passados como argumentos separados
        emailValue = email;
        passwordValue = password;
      }

      console.log("Tentando login com:", emailValue);
      console.log("URL da API:", `${API_BASE}/api/auth/login`);
      
      // Verificação de dados obrigatórios
      if (!emailValue || !passwordValue) {
        throw new Error("Email e senha são obrigatórios");
      }
      
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailValue,
          password: passwordValue
        }),
      });
      
      console.log("Status da resposta:", response.status);
      
      // Processando resposta de erro
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || `Erro ${response.status}`;
        console.error("Erro de login:", errorMessage);
        throw new Error(errorMessage);
      }
      
      return processResponse(response);
    } catch (error) {
      console.error('Erro ao realizar login:', error);
      throw error;
    }
  },

  // Restante das funções permanece igual...
  // (todas as outras funções do arquivo mantidas como estavam)

  // getProfile, updateProfile, etc...
  
  // Função getProfile (mantenha como estava)
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

  // Outras funções permanecem iguais...
  // Incluir todas as funções originais aqui
};

export default authService;
