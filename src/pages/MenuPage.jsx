// src/pages/MenuPage.jsx - VERSÃO FINAL E ROBUSTA

import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Edit, Trash2, Image as ImageIcon, FileSpreadsheet, SlidersHorizontal } from 'lucide-react';
import OpcoesDoItem from '../components/OpcoesDoItem';
import { menuService } from '../services/menuService';
import { MenuItemModal } from '../components/MenuItemModal';
import ImportarCatalogo from '../components/ImportarCatalogo';
import { useToast } from '../context/ToastContext.jsx';
import { useConfirm } from '../components/ConfirmProvider.jsx';
import AvisoNovidade from '../components/AvisoNovidade.jsx';
import { emPromocao, descontoPct } from '../utils/promo';

export function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [importAberto, setImportAberto] = useState(false);
  // Item cujas opções (corte, molho, adicionais) estão sendo editadas.
  const [itemOpcoes, setItemOpcoes] = useState(null);
  const { addToast } = useToast();
  const confirm = useConfirm();

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
    if (!(await confirm({ title: 'Excluir item', message: 'Tem certeza que deseja excluir este item?', confirmText: 'Excluir', danger: true }))) {
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
            <div className="flex flex-wrap gap-2">
            {/* Catálogo grande (mercado, farmácia, pet) não se cadastra item a
                item — o dono desiste antes do fim. */}
            <button
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
            onClick={() => setImportAberto(true)}
            >
            <FileSpreadsheet size={20} />
            <span className="hidden sm:inline">Importar planilha</span>
            <span className="sm:hidden">Planilha</span>
            </button>
            <button
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow hover:bg-orange-600 transition-colors min-h-[44px]"
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            >
            <PlusCircle size={20} />
            <span className="hidden sm:inline">Adicionar Novo Item</span>
            <span className="sm:hidden">Adicionar</span>
            </button>
            </div>
        </div>

        <AvisoNovidade id="promo-item-2026-08" titulo="Novo: preço promocional por item">
            <p>
                Agora cada item do seu cardápio pode ter um <strong>preço promocional</strong>.
                Abra o item em Editar e preencha o campo "Preço promocional".
            </p>
            <p>
                O cliente vê o valor promocional em destaque e o preço normal riscado do lado,
                com o selo de desconto. <strong>A comissão da Inksa incide sobre o valor
                promocional</strong> — você não paga comissão sobre um preço que ninguém pagou.
            </p>
            <p>
                Para encerrar a promoção, apague o campo. Enquanto ela estiver valendo, o item
                aparece marcado aqui na lista.
            </p>
        </AvisoNovidade>

        <ImportarCatalogo
            aberto={importAberto}
            onFechar={() => setImportAberto(false)}
            onConcluido={fetchMenuItems}
        />

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
                        {/* O que este item já pergunta ao cliente. Sem isto,
                            descobrir quais itens têm opção exigiria abrir um
                            por um — e num cardápio de 40 linhas ninguém abre. */}
                        {item.grupos_opcoes?.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.grupos_opcoes.map((g) => (
                              <span key={g} className="rounded bg-orange-50 px-1.5 py-0.5 text-[11px] font-medium text-orange-700 ring-1 ring-orange-100">
                                {g}
                              </span>
                            ))}
                          </div>
                        )}
                        </td>
                        <td className="p-4 text-gray-600">{item.category}</td>
                        {/* PROMOÇÃO VISÍVEL NA LISTA — de propósito.
                            Promoção que só aparece dentro do formulário é
                            promoção esquecida ligada: o parceiro cria 30% off
                            numa sexta e descobre em março. Aqui ele vê todas
                            de uma vez ao abrir o cardápio. */}
                        <td className="p-4 font-medium text-gray-800">
                            {emPromocao(item) ? (
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-green-700">R$ {parseFloat(item.promo_price).toFixed(2)}</span>
                                        <span className="text-xs text-gray-400 line-through font-normal">
                                            R$ {parseFloat(item.price || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <span className="self-start rounded bg-green-100 px-1.5 py-0.5 text-[11px] font-bold text-green-700">
                                        {descontoPct(item)}% OFF
                                    </span>
                                </div>
                            ) : (
                                <>R$ {parseFloat(item.price || 0).toFixed(2)}</>
                            )}
                        </td>
                        <td className="p-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {item.is_available ? 'Disponível' : 'Indisponível'}
                        </span>
                        </td>
                        <td className="p-4">
                        <div className="flex gap-2">
                            <button
                              title="Opções do item (tamanho, sabor, adicionais)"
                              className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center ${
                                item.grupos_opcoes?.length
                                  ? 'text-orange-600 hover:text-orange-800'
                                  : 'text-gray-400 hover:text-orange-600'}`}
                              onClick={() => setItemOpcoes(item)}
                            ><SlidersHorizontal size={18} /></button>
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

        {itemOpcoes && (
            <OpcoesDoItem item={itemOpcoes} onFechar={() => setItemOpcoes(null)} />
        )}
    </div>
  );
}
