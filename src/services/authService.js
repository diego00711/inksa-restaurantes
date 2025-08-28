// src/services/authService.js - Apenas a função login corrigida
  
  /**
   * Realiza login do restaurante.
   * POST /api/auth/login
   */
  login: async (credentials) => {
    try {
      console.log("Iniciando login com:", JSON.stringify(credentials)); // Log para debug
      console.log("URL da API:", `${API_BASE}/api/auth/login`); // Log para debug
      
      const response = await fetch(`${API_BASE}/api/auth/login`, { // Remova qualquer "1" que esteja aparecendo aqui
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      // Log para debug
      console.log("Status da resposta:", response.status);
      
      // Processamento manual para melhor diagnóstico
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro de login:", response.status, errorText);
        throw new Error(`Erro no servidor: ${response.status} ${errorText || "Sem detalhes"}`);
      }
      
      return processResponse(response);
    } catch (error) {
      console.error("Erro durante login:", error);
      throw error;
    }
  },
