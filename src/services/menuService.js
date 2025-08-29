// src/services/menuService.js - VERSÃO CORRIGIDA E SIMPLIFICADA

import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

export const menuService = {
  /**
   * Busca todos os itens do cardápio do restaurante logado.
   * GET /api/menu
   * O backend identifica o restaurante pelo token.
   */
  getMenuItems: async (signal) => {
    try {
      const response = await fetch(`${RESTAURANT_API_URL}/api/menu`, {
        headers: createAuthHeaders(),
        signal,
      });
      
      const data = await processResponse(response);
      return data?.data ?? data; // Retorna o array de itens dentro da chave 'data'
    } catch (error) {
      console.error('Erro ao buscar itens do cardápio:', error);
      throw error;
    }
  },

  /**
   * Adiciona um novo item ao cardápio.
   * POST /api/menu
   */
  addMenuItem: async (itemData) => {
    // O backend já sabe o user_id pelo token, não precisamos enviá-lo no corpo.
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
        headers: createAuthHeaders(), // Não defina 'Content-Type' aqui
        body: formData,
      }
    );
    return processResponse(response);
  },
};

export default menuService;
