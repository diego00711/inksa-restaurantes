// src/pages/SettingsPage.jsx - VERSÃO FINAL E OTIMIZADA

import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService'; 
import { Save, Loader } from 'lucide-react'; 
import { useToast } from '../context/ToastContext.jsx'; 
import { useProfile } from '../context/ProfileContext';

export function SettingsPage() {
  const [profileData, setProfileData] = useState({
    restaurant_name: '', business_name: '', cnpj: '', phone: '',
    description: '', cuisine_type: '', category: '',
    delivery_time: '', delivery_fee: 0, minimum_order: 0,
    address_street: '', address_number: '', address_complement: '',
    address_neighborhood: '', address_city: '', address_state: '',
    address_zipcode: '', logo_url: '', is_open: false,
    payout_frequency: 'weekly',
    bank_name: '', bank_agency: '',
    bank_account_number: '', bank_account_type: 'corrente',
    pix_key: '', mp_account_id: '', delivery_type: 'platform',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast(); 
  const { updateProfileInContext } = useProfile();

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authService.getProfile();
      if (response && response.data) {
        const profile = response.data;
        setProfileData(prevData => ({ ...prevData, ...profile, is_open: profile.is_open ?? false })); 
        if (profile.logo_url) {
          setLogoPreview(profile.logo_url);
        }
      } else {
        addToast('warning', "Não foi possível carregar os dados do perfil.");
      }
    } catch (err) {
      console.error("Erro ao buscar perfil:", err);
      addToast('error', err.message || "Erro ao carregar o perfil do restaurante.");
    } finally {
      setIsLoading(false);
    }
  }, [addToast, updateProfileInContext]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData(prevData => ({ 
      ...prevData, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    try {
      let finalProfileData = { ...profileData };

      if (logoFile) {
        addToast('info', 'Enviando novo logo...');
        const uploadResponse = await authService.uploadRestaurantLogo(logoFile);

        if (uploadResponse && uploadResponse.data && uploadResponse.data.logo_url) {
          finalProfileData.logo_url = uploadResponse.data.logo_url;
          // ✅ CORREÇÃO: A linha de toast de sucesso foi removida daqui para evitar duplicidade.
        } else {
          throw new Error("Falha ao processar o upload do logo.");
        }
      }
      
      addToast('info', 'Salvando alterações do perfil...');
      const response = await authService.updateProfile(finalProfileData);
      
      if (response && response.data) {
        const updatedProfile = response.data;
        
        setProfileData(updatedProfile);
        if (updatedProfile.logo_url) {
          setLogoPreview(updatedProfile.logo_url);
        }
        updateProfileInContext(updatedProfile);
        
        // Este é o único toast de sucesso, exibido no final de todo o processo.
        addToast('success', "Perfil atualizado com sucesso!");
        setLogoFile(null);
      } else {
        throw new Error("Resposta inválida do servidor ao atualizar o perfil.");
      }

    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      addToast('error', err.message || "Falha ao atualizar o perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin" size={48} /></div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Configurações do Restaurante</h1>
      <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Secção do Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo do Restaurante</label>
              <div className="flex items-center gap-5">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-24 w-24 rounded-full object-cover border-2 border-gray-200" />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <span className="text-sm">Sem Logo</span>
                  </div>
                )}
                <div>
                  <label htmlFor="logo-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <span>Mudar foto</span>
                    <input id="logo-upload" name="logo-upload" type="file" className="sr-only" accept="image/*" onChange={handleLogoChange} />
                  </label>
                </div>
              </div>
            </div>
            
            {/* Secção de Informações Gerais */}
            <div className="border-t pt-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Informações Gerais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="restaurant_name" className="block text-sm font-medium text-gray-700">Nome do Restaurante</label>
                  <input type="text" name="restaurant_name" id="restaurant_name" value={profileData.restaurant_name || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
                  <input type="tel" name="phone" id="phone" value={profileData.phone || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                <div>
                  <label htmlFor="cuisine_type" className="block text-sm font-medium text-gray-700">Tipo de Cozinha (ex: Italiana, Japonesa)</label>
                  <input type="text" name="cuisine_type" id="cuisine_type" value={profileData.cuisine_type || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoria (ex: Lanches, Pizzaria)</label>
                  <input type="text" name="category" id="category" value={profileData.category || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição Curta do Restaurante</label>
                  <textarea name="description" id="description" rows="3" value={profileData.description || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                </div>
              </div>
            </div>

            {/* Secção de Operação e Entrega */}
            <div className="border-t pt-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Operação e Entrega</h2>
              <div className="space-y-2 mb-6">
                <label className="block text-sm font-medium text-gray-700">Tipo de Entrega</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input type="radio" name="delivery_type" value="platform" checked={profileData.delivery_type === 'platform'} onChange={handleChange} className="form-radio h-4 w-4 text-indigo-600"/>
                    <span className="ml-2 text-gray-800">Entrega da Plataforma (frete dinâmico)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="delivery_type" value="own" checked={profileData.delivery_type === 'own'} onChange={handleChange} className="form-radio h-4 w-4 text-indigo-600"/>
                    <span className="ml-2 text-gray-800">Entrega Própria (frete fixo)</span>
                  </label>
                </div>
              </div>
              {profileData.delivery_type === 'own' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border-l-4 border-indigo-200 bg-indigo-50 rounded-md">
                  <div>
                    <label htmlFor="delivery_time" className="block text-sm font-medium text-gray-700">Tempo de Entrega (ex: 30-45 min)</label>
                    <input type="text" name="delivery_time" id="delivery_time" value={profileData.delivery_time || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                  </div>
                  <div>
                    <label htmlFor="delivery_fee" className="block text-sm font-medium text-gray-700">Taxa de Entrega (R$)</label>
                    <input type="number" name="delivery_fee" id="delivery_fee" step="0.01" value={profileData.delivery_fee || 0} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                  </div>
                  <div>
                    <label htmlFor="minimum_order" className="block text-sm font-medium text-gray-700">Pedido Mínimo (R$)</label>
                    <input type="number" name="minimum_order" id="minimum_order" step="0.01" value={profileData.minimum_order || 0} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                  </div>
                </div>
              )}
            </div>

            {/* Secção de Endereço */}
            <div className="border-t pt-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Endereço do Restaurante</h2>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                <div className="col-span-6 md:col-span-4">
                  <label htmlFor="address_street" className="block text-sm font-medium text-gray-700">Rua</label>
                  <input type="text" name="address_street" value={profileData.address_street || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div className="col-span-6 md:col-span-2">
                  <label htmlFor="address_number" className="block text-sm font-medium text-gray-700">Número</label>
                  <input type="text" name="address_number" value={profileData.address_number || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div className="col-span-6">
                  <label htmlFor="address_complement" className="block text-sm font-medium text-gray-700">Complemento (opcional)</label>
                  <input type="text" name="address_complement" value={profileData.address_complement || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div className="col-span-6 md:col-span-3">
                  <label htmlFor="address_neighborhood" className="block text-sm font-medium text-gray-700">Bairro</label>
                  <input type="text" name="address_neighborhood" value={profileData.address_neighborhood || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div className="col-span-6 md:col-span-3">
                  <label htmlFor="address_city" className="block text-sm font-medium text-gray-700">Cidade</label>
                  <input type="text" name="address_city" value={profileData.address_city || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                 <div className="col-span-6 md:col-span-3">
                  <label htmlFor="address_state" className="block text-sm font-medium text-gray-700">Estado (UF)</label>
                  <input type="text" name="address_state" maxLength="2" value={profileData.address_state || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div className="col-span-6 md:col-span-3">
                  <label htmlFor="address_zipcode" className="block text-sm font-medium text-gray-700">CEP</label>
                  <input type="text" name="address_zipcode" value={profileData.address_zipcode || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
              </div>
            </div>

            {/* Secção de Informações de Pagamento */}
            <div className="border-t pt-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Informações de Pagamento</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="payout_frequency" className="block text-sm font-medium text-gray-700">Frequência de Pagamento</label>
                  <select name="payout_frequency" id="payout_frequency" value={profileData.payout_frequency || 'weekly'} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="weekly">Semanal</option>
                      <option value="biweekly">Quinzenal</option>
                      <option value="monthly">Mensal</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700">Nome do Banco</label>
                  <input type="text" name="bank_name" value={profileData.bank_name || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div>
                  <label htmlFor="bank_agency" className="block text-sm font-medium text-gray-700">Agência</label>
                  <input type="text" name="bank_agency" value={profileData.bank_agency || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div>
                  <label htmlFor="bank_account_number" className="block text-sm font-medium text-gray-700">Número da Conta (com dígito)</label>
                  <input type="text" name="bank_account_number" value={profileData.bank_account_number || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div>
                  <label htmlFor="bank_account_type" className="block text-sm font-medium text-gray-700">Tipo de Conta</label>
                   <select name="bank_account_type" id="bank_account_type" value={profileData.bank_account_type || 'corrente'} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="corrente">Conta Corrente</option>
                      <option value="poupanca">Conta Poupança</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="pix_key" className="block text-sm font-medium text-gray-700">Chave PIX</label>
                  <input type="text" name="pix_key" value={profileData.pix_key || ''} onChange={handleChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 w-48 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed">
                {isSaving ? <><Loader size={18} className="animate-spin" /> A guardar...</> : <><Save size={18} /> Guardar Alterações</>}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
}
