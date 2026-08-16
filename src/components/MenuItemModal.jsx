// src/components/MenuItemModal.jsx (VERSÃO FINAL E DEFINITIVA)

import React, { useState, useEffect } from 'react';
import { menuService } from '../services/menuService';
import { categoryService } from '../services/categoryService';
import { useToast } from '../context/ToastContext.jsx';
import { useProfile } from '../context/ProfileContext';
import { XCircle } from 'lucide-react';

// Espelha _SEGMENTOS_COM_PESO do backend (src/routes/menu.py). Aqui o efeito é
// só avisar antes; quem realmente barra é o servidor — o app pode estar numa
// versão antiga, e regra que só existe na tela não é regra.
const SEGMENTOS_COM_PESO = ['pet', 'mercado', 'agropecuaria', 'bebidas'];

export function MenuItemModal({ onClose, onItemAdded, onItemUpdated, itemToEdit }) {
	const [formData, setFormData] = useState({ name: '', description: '', price: '', category: '', is_available: true, image_url: '', peso_kg: '' });
	const [selectedFile, setSelectedFile] = useState(null);
	const [imagePreview, setImagePreview] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [categories, setCategories] = useState([]);
	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const { addToast } = useToast();
	const { profile } = useProfile();
	const pesoObrigatorio = SEGMENTOS_COM_PESO.includes(
		String(profile?.segment || '').trim().toLowerCase()
	);

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const data = await categoryService.getCategories();
				setCategories(data || []);
			} catch (err) {
				addToast('error', err.message || "Erro ao carregar categorias.");
			}
		};
		fetchCategories();
	}, [addToast]);

	useEffect(() => {
		if (itemToEdit) {
			setFormData({
				name: itemToEdit.name || '',
				description: itemToEdit.description || '',
				price: itemToEdit.price?.toString() || '',
				category: itemToEdit.category || '',
				is_available: itemToEdit.is_available !== undefined ? itemToEdit.is_available : true,
				image_url: itemToEdit.image_url || '',
				peso_kg: itemToEdit.peso_kg != null ? String(itemToEdit.peso_kg) : '',
			});
			setImagePreview(itemToEdit.image_url || null);
		} else {
			setFormData({ name: '', description: '', price: '', category: '', is_available: true, image_url: '', peso_kg: '' });
			setImagePreview(null);
			setSelectedFile(null);
		}
	}, [itemToEdit]);

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setSelectedFile(file);
			setImagePreview(URL.createObjectURL(file));
		}
	};

	const handleRemoveImage = () => {
		setSelectedFile(null);
		setImagePreview(null);
		const fileInput = document.getElementById('image_upload');
		if (fileInput) fileInput.value = '';
		setFormData(prev => ({ ...prev, image_url: null }));
	};

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: type === 'checkbox' ? checked : value }));
    };

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (isLoading || isUploadingImage) return;
		setIsLoading(true);

		let finalImageUrl = formData.image_url || null;

		try {
			if (selectedFile) {
				setIsUploadingImage(true);
				addToast('info', "A carregar imagem...");
				
				// ✅ AJUSTE FINAL: O serviço retorna { data: { image_url: '...' } }.
				// Extraímos a propriedade corretamente.
				const uploadResponse = await menuService.uploadMenuItemImage(selectedFile);
				finalImageUrl = uploadResponse?.data?.image_url || uploadResponse?.image_url || null;
				if (!finalImageUrl) {
					throw new Error("Falha ao obter URL da imagem após upload.");
				}

				addToast('success', "Imagem carregada com sucesso!");
				setIsUploadingImage(false);
			}

			const itemDataToSend = { ...formData, price: parseFloat(formData.price) || 0, image_url: finalImageUrl };

			if (itemToEdit) {
				const response = await menuService.updateMenuItem(itemToEdit.id, itemDataToSend);
				addToast('success', 'Item atualizado com sucesso!');
				if (onItemUpdated) onItemUpdated(response.data);
			} else {
				const response = await menuService.addMenuItem(itemDataToSend);
				addToast('success', 'Item adicionado com sucesso!');
				if (onItemAdded) onItemAdded(response.data);
			}

			onClose();
		} catch (err) {
			console.error("Erro ao salvar item:", err);
			const errorMessage = err.response?.data?.error || err.message || "Falha ao salvar o item.";
			addToast('error', errorMessage);
		} finally {
			setIsLoading(false);
			setIsUploadingImage(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start sm:items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800">{itemToEdit ? 'Editar Item do Cardápio' : 'Adicionar Novo Item'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Item</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
                        <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows="3" className="mt-1 w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"></textarea>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Preço (ex: 45.50)</label>
                            <input type="number" name="price" id="price" step="0.01" value={formData.price} onChange={handleChange} required className="mt-1 w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                        </div>
                        {/* Peso decide QUEM pode entregar: um saco de ração de
                            30 kg não vai de moto. Deixar em branco só faz
                            sentido em item leve — comida, bebida, lanche. */}
                        <div className="flex-1">
                            <label htmlFor="peso_kg" className="block text-sm font-medium text-gray-700">
                                Peso em kg {pesoObrigatorio && <span className="text-red-500">*</span>}
                            </label>
                            <input type="number" name="peso_kg" id="peso_kg" step="0.1" min="0" placeholder="ex: 15"
                                value={formData.peso_kg} onChange={handleChange}
                                required={pesoObrigatorio}
                                className="mt-1 w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                            <p className="mt-1 text-xs text-gray-500">
                                {pesoObrigatorio
                                    ? 'Obrigatório no seu segmento. É o peso que define o frete e se o pedido cabe numa moto ou precisa de carro — sem ele, um pedido pesado sai barato demais e vai parar numa moto.'
                                    : 'Preencha em itens pesados (ração, gás, bebida em fardo). Isso define se o pedido pode ir de moto ou precisa de carro. Item leve pode ficar em branco.'}
                            </p>
                        </div>
                        <div className="flex-1">
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoria</label>
                            <select name="category" id="category" value={formData.category} onChange={handleChange} required className="mt-1 w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                                <option value="" disabled>Selecione uma categoria</option>
                                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer min-h-[44px]">
                            <input type="checkbox" name="is_available" checked={formData.is_available} onChange={handleChange} className="form-checkbox h-4 w-4 text-primary rounded"/>
                            <span className="ml-2">Disponível para Venda</span>
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Item</label>
                        <input type="file" id="image_upload" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-100 file:text-primary hover:file:bg-orange-200"/>
                        {imagePreview && (
                        <div className="mt-4 relative w-32 h-32 border rounded-md overflow-hidden">
                            <img src={imagePreview} alt="Pré-visualização" className="w-full h-full object-cover max-w-full" />
                            <button type="button" onClick={handleRemoveImage} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600" title="Remover imagem">
                            <XCircle size={16} />
                            </button>
                        </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 min-h-[44px]">Cancelar</button>
                        <button type="submit" disabled={isLoading || isUploadingImage} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-orange-600 disabled:bg-orange-300 min-h-[44px]">
                        {isLoading ? 'A Salvar...' : (itemToEdit ? 'Atualizar Item' : 'Salvar Item')}
                        </button>
                    </div>
                </form>
            </div>
		</div>
	);
}