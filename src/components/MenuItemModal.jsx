// src/components/MenuItemModal.jsx (VERSÃO FINAL E DEFINITIVA)

import React, { useState, useEffect } from 'react';
import CampoPeso from './CampoPeso';
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
	const [formData, setFormData] = useState({ name: '', description: '', price: '', category: '', is_available: true, image_url: '', peso_kg: '', promo_price: '' });
	// Unidade SÓ da digitação — o banco guarda sempre kg. Começa em 'kg'
	// porque todo item já cadastrado foi digitado assim: abrir em 'g'
	// multiplicaria por mil o que a pessoa vê.
	const [pesoUnidade, setPesoUnidade] = useState('kg');
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
				// Campo vazio = sem promoção. É assim que o parceiro desliga:
				// apagando o valor. Não existe botão separado de desativar.
				promo_price: itemToEdit.promo_price != null ? String(itemToEdit.promo_price) : '',
			});
			setImagePreview(itemToEdit.image_url || null);
		} else {
			setFormData({ name: '', description: '', price: '', category: '', is_available: true, image_url: '', peso_kg: '', promo_price: '' });
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

			// O banco guarda SEMPRE em kg. A unidade é só da digitação.
			const _peso = parseFloat(String(formData.peso_kg ?? '').replace(',', '.'));
			const pesoEmKg = Number.isFinite(_peso) && _peso > 0
				? (pesoUnidade === 'g' ? _peso / 1000 : _peso)
				: '';
			const itemDataToSend = { ...formData, price: parseFloat(formData.price) || 0,
				peso_kg: pesoEmKg, image_url: finalImageUrl };

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
                            <p className="mt-1 text-xs text-gray-500">
                                O preço normal do item, sem desconto.
                            </p>
                        </div>
                        {/* PROMOÇÃO — o preço de venda enquanto ela durar. O
                            cliente vê este valor em destaque e o preço normal
                            riscado do lado. A comissão da Inksa incide sobre o
                            valor promocional, ou seja, sobre o que realmente
                            entrou; a loja não paga comissão sobre um preço que
                            ninguém pagou. */}
                        <div className="flex-1">
                            <label htmlFor="promo_price" className="block text-sm font-medium text-gray-700">
                                Preço promocional
                            </label>
                            <input type="number" name="promo_price" id="promo_price" step="0.01" min="0"
                                placeholder="deixe vazio se não houver"
                                value={formData.promo_price} onChange={handleChange}
                                className="mt-1 w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                            {(() => {
                                const base = parseFloat(formData.price) || 0;
                                const promo = parseFloat(formData.promo_price) || 0;
                                if (!promo) {
                                    return (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Vazio = sem promoção. Para encerrar uma promoção, apague este campo.
                                        </p>
                                    );
                                }
                                if (promo >= base) {
                                    return (
                                        <p className="mt-1 text-xs text-red-600 font-medium">
                                            Precisa ser menor que o preço normal. Para baixar o preço de vez,
                                            altere o preço normal em vez de criar promoção.
                                        </p>
                                    );
                                }
                                return (
                                    <p className="mt-1 text-xs text-green-700 font-medium">
                                        {Math.round(((base - promo) / base) * 100)}% de desconto — o cliente vê
                                        R$ {promo.toFixed(2)} e R$ {base.toFixed(2)} riscado.
                                    </p>
                                );
                            })()}
                        </div>
                        {/* Peso decide QUEM pode entregar e QUANTO custa o
                            frete. O campo virou componente próprio porque
                            "300" numa lata (grama digitada em campo de quilo)
                            passou sem aviso e triplicou o frete de um cliente.
                            Ver components/CampoPeso.jsx. */}
                        <CampoPeso
                            valorKg={formData.peso_kg}
                            unidade={pesoUnidade}
                            obrigatorio={pesoObrigatorio}
                            onChange={({ valor, unidade }) => {
                                setPesoUnidade(unidade);
                                setFormData((f) => ({ ...f, peso_kg: valor }));
                            }}
                        />
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