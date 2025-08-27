// src/services/categoryService.js
// Serviço de categorias do Portal do Restaurante

import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';

export const categoryService = {
  /**
   * Busca todas as categorias do restaurante.
   * GET /api/categories
   */
  getCategories: async (signal) => {
    const response = await fetch(`${RESTAURANT_API_URL}/api/categories`, {
      headers: createAuthHeaders(),
      signal,
    });
    const data = await processResponse(response);
    return data?.data ?? data;
  },

  /**
   * Adiciona uma nova categoria.
   * POST /api/categories
   */
  addCategory: async (categoryName) => {
    const response = await fetch(`${RESTAURANT_API_URL}/api/categories`, {
      method: 'POST',
      headers: { ...createAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: categoryName }),
    });
    return processResponse(response);
  },

  /**
   * Atualiza o nome de uma categoria.
   * PUT /api/categories/:categoryId
   */
  updateCategory: async (categoryId, newName) => {
    const response = await fetch(
      `${RESTAURANT_API_URL}/api/categories/${encodeURIComponent(categoryId)}`,
      {
        method: 'PUT',
        headers: { ...createAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      }
    );
    return processResponse(response);
  },

  /**
   * Apaga uma categoria.
   * DELETE /api/categories/:categoryId
   */
  deleteCategory: async (categoryId) => {
    const response = await fetch(
      `${RESTAURANT_API_URL}/api/categories/${encodeURIComponent(categoryId)}`,
      {
        method: 'DELETE',
        headers: createAuthHeaders(),
      }
    );
    return processResponse(response);
  },
};
