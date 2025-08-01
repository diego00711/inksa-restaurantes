// Arquivo: src/services/menuService.js (VERSÃO FINAL E COMPLETA)

import { API_BASE_URL, processResponse, createAuthHeaders } from './api.js';

export const menuService = {
  /**
   * Busca todos os itens do cardápio do restaurante logado.
   */
  getMenuItems: async () => {
    const response = await fetch(`${API_BASE_URL}/menu`, {
      headers: createAuthHeaders(),
    });
    return processResponse(response);
  },
  
  /**
   * Adiciona um novo item ao cardápio.
   */
  addMenuItem: async (itemData) => {
    const response = await fetch(`${API_BASE_URL}/menu`, {
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
   */
  updateMenuItem: async (itemId, itemData) => {
    const response = await fetch(`${API_BASE_URL}/menu/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...createAuthHeaders(),
      },
      body: JSON.stringify(itemData),
    });
    return processResponse(response);
  },
  
  /**
   * Deleta um item do cardápio.
   */
  deleteMenuItem: async (itemId) => {
    const response = await fetch(`${API_BASE_URL}/menu/${itemId}`, {
        method: 'DELETE',
        headers: createAuthHeaders(),
    });
    return processResponse(response);
  },

  /**
   * Faz o upload da imagem de um item do cardápio.
   */
  uploadMenuItemImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/menu/upload-image`, {
      method: 'POST',
      headers: {
        ...createAuthHeaders(),
      },
      body: formData,
    });
    return processResponse(response);
  }
};