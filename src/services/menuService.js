// src/services/menuService.js - VERSÃO FINAL E ROBUSTA

import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

export const menuService = {
  /**
   * Busca todos os itens do cardápio do restaurante logado.
   * GET /api/menu
   */
  getMenuItems: async (signal) => {
    try {
      const response = await fetch(`${RESTAURANT_API_URL}/api/menu`, {
        headers: createAuthHeaders(),
        signal,
      });
      
      const processedData = await processResponse(response);
      
      // ✅ GARANTIA: Lida com ambos os formatos de resposta: { data: [...] } ou [...]
      // Se a API enviar um objeto com a chave 'data', nós a extraímos.
      if (processedData && processedData.data && Array.isArray(processedData.data)) {
        return processedData.data;
      }
      
      // Se a API enviar um array diretamente, nós o retornamos.
      if (Array.isArray(processedData)) {
        return processedData;
      }

      // Como fallback, se a resposta for inesperada, retorna um array vazio para não quebrar o app.
      console.warn("Resposta da API de menu não era um array:", processedData);
      return [];

    } catch (error) {
      console.error('Erro detalhado ao buscar itens do cardápio:', error);
      throw error; // Relança o erro para o componente poder tratá-lo.
    }
  },

  /**
   * Adiciona um novo item ao cardápio.
   * POST /api/menu
   */
  addMenuItem: async (itemData) => {
    const response = await fetch(`${RESTAURANT_API_URL}/api/menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...createAuthHeaders(),
      },
      body: JSON.stringify(itemData),
    });
    return processResponse(response);
  },

  /**
   * Atualiza um item existente no cardápio.
   * PUT /api/menu/:itemId
   */
  updateMenuItem: async (itemId, itemData) => {
    const response = await fetch(
      `${RESTAURANT_API_URL}/api/menu/${encodeURIComponent(itemId)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...createAuthHeaders(),
        },
        body: JSON.stringify(itemData),
      }
    );
    return processResponse(response);
  },

  /**
   * Deleta um item do cardápio.
   * DELETE /api/menu/:itemId
   */
  deleteMenuItem: async (itemId) => {
    const response = await fetch(
      `${RESTAURANT_API_URL}/api/menu/${encodeURIComponent(itemId)}`,
      {
        method: 'DELETE',
        headers: createAuthHeaders(),
      }
    );
    return processResponse(response);
  },

  /**
   * Faz o upload da imagem de um item do cardápio.
   * POST /api/menu/upload-image
   */
  uploadMenuItemImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${RESTAURANT_API_URL}/api/menu/upload-image`,
      {
        method: 'POST',
        headers: createAuthHeaders(),
        body: formData,
      }
    );
    return processResponse(response);
  },
};

export default menuService;
