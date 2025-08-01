// src/pages/CategoryManagementPage.jsx (VERSÃO FINAL CORRIGIDA)

import React, { useState, useEffect } from 'react';
// ✅ CORREÇÃO 1: Importando do serviço correto 'categoryService'
import { categoryService } from '@/services/categoryService'; 
import { useAuth } from '@/context/AuthContext.jsx'; 
import { useToast } from '@/context/ToastContext.jsx'; 
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

export function CategoryManagementPage() {
    const { addToast } = useToast(); 
    const { user, isLoading: authLoading } = useAuth();

    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    const fetchCategories = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // ✅ CORREÇÃO 2: Chamando a função do serviço correto
            const data = await categoryService.getCategories();
            setCategories(data || []); // Garante que é sempre um array
        } catch (err) {
            console.error("Erro ao buscar categorias:", err);
            const errorMessage = err.message || "Não foi possível carregar as categorias.";
            setError(errorMessage);
            addToast(errorMessage, 'error'); 
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user) {
            fetchCategories();
        }
        if (!authLoading && !user) {
            setError("Você precisa estar logado para gerenciar categorias.");
            setIsLoading(false);
        }
    }, [user, authLoading]);

    const handleAddOrUpdateCategory = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        if (!newCategoryName.trim()) {
            const errorMessage = "O nome da categoria não pode ser vazio.";
            setError(errorMessage);
            addToast(errorMessage, 'warning'); 
            setIsSaving(false);
            return;
        }

        try {
            if (editingCategory) {
                // ✅ CORREÇÃO 3: Chamando a função do serviço correto
                await categoryService.updateCategory(editingCategory.id, newCategoryName);
                addToast("Categoria atualizada com sucesso!", 'success'); 
            } else {
                // ✅ CORREÇÃO 4: Chamando a função do serviço correto
                await categoryService.addCategory(newCategoryName);
                addToast("Categoria adicionada com sucesso!", 'success'); 
            }
            setNewCategoryName('');
            setEditingCategory(null);
            fetchCategories();
        } catch (err) {
            console.error("Erro ao salvar categoria:", err);
            const errorMessage = err.message || "Falha ao salvar a categoria.";
            setError(errorMessage);
            addToast(errorMessage, 'error'); 
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = (category) => {
        setEditingCategory(category);
        setNewCategoryName(category.name);
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
        setNewCategoryName('');
        setError(null);
    };

    const handleDeleteCategory = async (categoryId) => {
        if (!window.confirm("Tem certeza que deseja excluir esta categoria?")) {
            return;
        }
        try {
            // ✅ CORREÇÃO 5: Chamando a função do serviço correto
            await categoryService.deleteCategory(categoryId);
            addToast("Categoria excluída com sucesso!", 'success'); 
            fetchCategories();
        } catch (err) {
            console.error("Erro ao excluir categoria:", err);
            addToast(err.message || "Falha ao excluir a categoria.", 'error'); 
        }
    };
    
    // O resto do seu código JSX continua perfeito e não precisa de alterações.
    if (authLoading) {
        return <div className="p-6 text-center text-gray-600">Carregando autenticação...</div>;
    }

    if (!user) {
        return (
            <div className="p-6 text-center text-red-500">
                Acesso negado. Por favor, faça login para gerenciar categorias.
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Gerenciamento de Categorias</h1>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    {editingCategory ? 'Editar Categoria' : 'Adicionar Nova Categoria'}
                </h2>
                <form onSubmit={handleAddOrUpdateCategory} className="flex flex-wrap gap-4 items-center">
                    <input
                        type="text"
                        placeholder="Nome da Categoria"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        required
                        disabled={isSaving}
                    />
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow hover:bg-orange-600 transition-colors disabled:bg-orange-300 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Salvando...' : (editingCategory ? 'Atualizar' : 'Adicionar')}
                    </button>
                    {editingCategory && (
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                            disabled={isSaving}
                        >
                            Cancelar
                        </button>
                    )}
                </form>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <h2 className="text-2xl font-bold text-gray-800 p-6 border-b">Categorias Existentes</h2>
                {isLoading ? (
                    <p className="text-center p-4 text-gray-600">Carregando categorias...</p>
                ) : categories.length === 0 ? (
                    <p className="text-center p-4 text-gray-500">Nenhuma categoria encontrada. Adicione uma acima!</p>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {categories.map((category) => (
                            <li key={category.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                <span className="text-lg font-medium text-gray-800">{category.name}</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditClick(category)}
                                        className="text-blue-600 hover:text-blue-800 p-2 rounded-md"
                                        title="Editar"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCategory(category.id)}
                                        className="text-red-600 hover:text-red-800 p-2 rounded-md"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}