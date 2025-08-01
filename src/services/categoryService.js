// Arquivo: src/services/categoryService.js (NOVO)

import { API_BASE_URL, processResponse, createAuthHeaders } from './api';

export const categoryService = {
    /**
     * Busca todas as categorias do restaurante.
     * Chama a rota GET /api/categories que está no seu menu.py.
     */
    getCategories: async () => {
        const response = await fetch(`${API_BASE_URL}/categories`, { 
            headers: createAuthHeaders() 
        });
        const data = await processResponse(response);
        return data.data;
    },

    /**
     * Adiciona uma nova categoria.
     * Chama a rota POST /api/categories.
     */
    addCategory: async (categoryName) => {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            method: 'POST',
            headers: { ...createAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: categoryName }),
        });
        return processResponse(response);
    },

    /**
     * Atualiza o nome de uma categoria.
     * @param {string} categoryId - O ID da categoria.
     * @param {string} newName - O novo nome da categoria.
     */
    updateCategory: async (categoryId, newName) => {
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
            method: 'PUT',
            headers: { ...createAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName }),
        });
        return processResponse(response);
    },

    /**
     * Apaga uma categoria.
     * @param {string} categoryId - O ID da categoria.
     */
    deleteCategory: async (categoryId) => {
        const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
            method: 'DELETE',
            headers: createAuthHeaders(),
        });
        return processResponse(response);
    },
};