// src/services/menuService.js
// Serviço de cardápio do Portal do Restaurante

import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

export const menuService = {
  /**
   * Busca todos os itens do cardápio do restaurante logado.
   * GET /api/menu
   */
  getMenuItems: async (signal) => {
    // Recupera o ID do restaurante do usuário logado
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
    const url = new URL(`${RESTAURANT_API_URL}/api/menu`);
    if (restaurantId) {
      url.searchParams.append('restaurant_id', restaurantId);
    }
    
    // Faz a requisição com o ID do restaurante
    const response = await fetch(url.toString(), {
      headers: createAuthHeaders(),
      signal,
    });
    
    const data = await processResponse(response);
    return data?.data ?? data;
  },

  // O resto do serviço permanece igual
  /**
   * Adiciona um novo item ao cardápio.
   * POST /api/menu
   */
  addMenuItem: async (itemData) => {
    // Recupera o ID do restaurante do usuário logado
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
    
    // Adiciona o ID do restaurante ao item
    const completeItemData = {
      ...itemData,
      restaurant_id: restaurantId
    };

    const response = await fetch(`${RESTAURANT_API_URL}/api/menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...createAuthHeaders(),
      },
      body: JSON.stringify(completeItemData),
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
