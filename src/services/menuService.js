// src/services/menuService.js
// Serviço de cardápio do Portal do Restaurante

import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

export const menuService = {
  /**
   * Busca todos os itens do cardápio do restaurante logado.
   * GET /api/menu
   */
  getMenuItems: async (signal) => {
    const response = await fetch(`${RESTAURANT_API_URL}/api/menu`, {
      headers: createAuthHeaders(),
      signal,
    });
    const data = await processResponse(response);
    return data?.data ?? data;
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
        headers: {
          // Não definir Content-Type manualmente para multipart
          ...createAuthHeaders(),
        },
        body: formData,
      }
    );
    return processResponse(response);
  },
};
