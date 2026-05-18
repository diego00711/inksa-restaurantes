// src/pages/MenuPage.jsx - VERSÃO FINAL E ROBUSTA

import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { menuService } from '../services/menuService';
import { MenuItemModal } from '../components/MenuItemModal';
import { useToast } from '../context/ToastContext.jsx'; 

export function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); 
  const { addToast } = useToast();

  const fetchMenuItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // ✅ GARANTIA: A função de serviço agora sempre retorna um array.
      const items = await menuService.getMenuItems();
      setMenuItems(items); // Define o estado diretamente com o array retornado.
    } catch (err) {
      console.error("Falha ao carregar o cardápio na página:", err);
      setError(err.message);
      addToast('error', err.message || "Erro ao carregar cardápio.");
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const handleItemAdded = (newItem) => {
    setMenuItems(prevItems => [newItem, ...prevItems]);
  };

  const handleItemUpdated = (updatedItem) => {
    setMenuItems(prevItems => 
      prevItems.map(item => (item.id === updatedItem.id ? updatedItem : item))
    );
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Tem certeza que deseja excluir este item?')) {
      return;
    }
    try {
      await menuService.deleteMenuItem(itemId);
      setMenuItems(prevItems => prevItems.filter(item => item.id !== itemId));
      addToast('success', 'Item excluído com sucesso!');
    } catch (err) {
      addToast('error', `Falha ao excluir o item: ${err.message || 'Erro desconhecido'}`);
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item); 
    setIsModalOpen(true); 
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null); 
  };

  return (
    <div>
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-800">Gestão de Cardápio</h1>
            <button
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow hover:bg-orange-600 transition-colors min-h-[44px]"
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            >
            <PlusCircle size={20} />
            <span className="hidden sm:inline">Adicionar Novo Item</span>
            <span className="sm:hidden">Adicionar</span>
            </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
            <table className="w-full text-left min-w-[560px]">
            <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                    <th className="p-4 font-semibold text-gray-600">Imagem</th>
                    <th className="p-4 font-semibold text-gray-600">Item</th>
                    <th className="p-4 font-semibold text-gray-600">Categoria</th>
                    <th className="p-4 font-semibold text-gray-600">Preço</th>
                    <th className="p-4 font-semibold text-gray-600">Status</th>
                    <th className="p-4 font-semibold text-gray-600">Ações</th>
                </tr>
            </thead>
            <tbody>
                {isLoading ? (
                <tr><td colSpan="6" className="text-center p-4 text-gray-500">Carregando cardápio...</td></tr>
                ) : error ? (
                <tr><td colSpan="6" className="text-center p-4 text-red-500">Erro ao carregar cardápio: {error}</td></tr>
                ) : menuItems.length > 0 ? (
                menuItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-4">
                            {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-md shadow-sm max-w-full" />
                            ) : (
                                <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                                    <ImageIcon size={24} />
                                </div>
                            )}
                        </td>
                        <td className="p-4">
                        <div className="font-medium text-gray-800 break-words">{item.name}</div>
                        <div className="text-sm text-gray-500 break-words">{item.description}</div>
                        </td>
                        <td className="p-4 text-gray-600">{item.category}</td>
                        <td className="p-4 font-medium text-gray-800">R$ {parseFloat(item.price || 0).toFixed(2)}</td>
                        <td className="p-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {item.is_available ? 'Disponível' : 'Indisponível'}
                        </span>
                        </td>
                        <td className="p-4">
                        <div className="flex gap-2">
                            <button className="text-blue-600 hover:text-blue-800 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={() => openEditModal(item)}><Edit size={18} /></button>
                            <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-800 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"><Trash2 size={18} /></button>
                        </div>
                        </td>
                    </tr>
                ))
                ) : (
                <tr><td colSpan="6" className="text-center p-4 text-gray-500">Nenhum item encontrado. Adicione um para começar.</td></tr>
                )}
            </tbody>
            </table>
        </div>

        {isModalOpen && (
            <MenuItemModal 
            onClose={handleCloseModal} 
            onItemAdded={handleItemAdded}
            onItemUpdated={handleItemUpdated} 
            itemToEdit={editingItem} 
            />
        )}
    </div>
  );
}
