// src/services/categoryService.js
// Serviço de categorias do Portal do Restaurante

import { RESTAURANT_API_URL, processResponse, createAuthHeaders } from './api';
import { apiFetch } from './apiClient';

export const categoryService = {
  /**
   * Busca todas as categorias do restaurante.
   * GET /api/categories
   */
  getCategories: async (signal) => {
    try {
      const response = await apiFetch(`${RESTAURANT_API_URL}/api/categories`, {
        headers: createAuthHeaders(),
        signal,
      });
      const data = await processResponse(response);
      return data?.data ?? data;
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      throw error;
    }
  },

  /**
   * Adiciona uma nova categoria.
   * POST /api/categories
   */
  addCategory: async (categoryName) => {
    try {
      const response = await apiFetch(`${RESTAURANT_API_URL}/api/categories`, {
        method: 'POST',
        headers: { ...createAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName }),
      });
      return processResponse(response);
    } catch (error) {
      console.error('Erro ao adicionar categoria:', error);
      throw error;
    }
  },

  /**
   * Atualiza o nome de uma categoria.
   * PUT /api/categories/:categoryId
   */
  updateCategory: async (categoryId, newName) => {
    try {
      const response = await apiFetch(
        `${RESTAURANT_API_URL}/api/categories/${encodeURIComponent(categoryId)}`,
        {
          method: 'PUT',
          headers: { ...createAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName }),
        }
      );
      return processResponse(response);
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      throw error;
    }
  },

  /**
   * Apaga uma categoria.
   * DELETE /api/categories/:categoryId
   */
  deleteCategory: async (categoryId) => {
    try {
      const response = await apiFetch(
        `${RESTAURANT_API_URL}/api/categories/${encodeURIComponent(categoryId)}`,
        {
          method: 'DELETE',
          headers: createAuthHeaders(),
        }
      );
      return processResponse(response);
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      throw error;
    }
  },
};
