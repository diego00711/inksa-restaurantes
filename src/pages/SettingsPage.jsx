// src/pages/SettingsPage.jsx - VERSÃO FINAL E OTIMIZADA

import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { RESTAURANT_API_URL } from '../services/api';
import { Save, Loader } from 'lucide-react';
import { useToast } from '../context/ToastContext.jsx';
import { useProfile } from '../context/ProfileContext';
import OpeningHoursEditor from '../components/OpeningHoursEditor';

// Uma consulta de geocodificação. Passa pelo NOSSO backend
// (/api/public/geocode) em vez de bater direto no Nominatim: lá tem cache e
// o User-Agent que a política deles exige — e que o navegador não deixa
// definir. No dia em que virar provedor pago, a chave fica no backend e
// nenhum app precisa de versão nova. Retorna {lat,lng} ou null.
async function geocodeOnce({ street, neighborhood, city, state }) {
  try {
    const p = new URLSearchParams({
      street: street || '', neighborhood: neighborhood || '',
      city: city || '', state: state || '',
    });
    const res = await fetch(`${RESTAURANT_API_URL}/api/public/geocode?${p}`);
    if (!res.ok) return null;
    const j = await res.json();
    const lat = Number(j?.data?.lat);
    const lng = Number(j?.data?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  } catch {
    /* falha de rede/limite — o chamador tenta a próxima variante */
  }
  return null;
}

// Geocodifica o endereço tentando do mais específico ao mais amplo e parando
// no primeiro que resolver. Muitas ruas de cidades menores não existem no
// OpenStreetMap; sem esse fallback o restaurante ficava SEM coordenadas e
// travado no gate ("Complete seu cadastro: Localização no mapa"), sem saída.
// Com a cadeia, no pior caso cai no centro do bairro/cidade — coordenada
// aproximada, mas suficiente para liberar o cadastro e o cálculo de frete.
async function geocodeProfileAddress(p) {
  const rua = (p.address_street || '').trim();
  const bairro = (p.address_neighborhood || '').trim();
  const cidade = (p.address_city || '').trim();
  const uf = (p.address_state || '').trim();
  if (!cidade || !uf) return null; // sem cidade/UF não há como localizar

  const variants = [
    { street: rua, neighborhood: bairro, city: cidade, state: uf },
    { street: rua, city: cidade, state: uf },
    { neighborhood: bairro, city: cidade, state: uf },
    { city: cidade, state: uf },
  ];
  const seen = new Set();
  for (const v of variants) {
    const chave = [v.street, v.neighborhood, v.city, v.state].filter(Boolean).join(', ');
    if (!chave || seen.has(chave)) continue;
    seen.add(chave);
    const hit = await geocodeOnce(v);
    if (hit) return hit;
  }
  return null;
}

// Segmento (vertical) do parceiro — eixo de expansão. O que aparece no topo do
// filtro do cliente. O "tipo" abaixo depende do segmento escolhido.
const SEGMENTS = [
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'farmacia', label: 'Farmácia' },
  { value: 'mercado', label: 'Supermercado / Mercado' },
  { value: 'padaria', label: 'Padaria' },
  // Cafeteria entrou porque duas lojas seguidas nao encaixavam em nada:
  // a Me Mimei (confeitaria) e as cafeterias da cidade. Quem nao acha o
  // proprio ramo marca 'Restaurante' — e aí some do filtro de quem
  // procura exatamente aquilo.
  { value: 'cafeteria', label: 'Cafeteria / Doceria' },
  { value: 'pet', label: 'Pet' },
  { value: 'conveniencia', label: 'Conveniência' },
  { value: 'bebidas', label: 'Bebidas / Adega' },
];

// Tipos controlados por segmento (vira o dropdown "Tipo" no cliente).
const TYPES_BY_SEGMENT = {
  restaurante: ['Pizza', 'Hambúrguer', 'Japonesa', 'Brasileira', 'Italiana', 'Mexicana', 'Árabe', 'Lanches', 'Marmita', 'Saudável', 'Vegetariana', 'Frango', 'Churrasco', 'Frutos do mar', 'Massas', 'Açaí', 'Sobremesa', 'Café', 'Bebidas'],
  farmacia: ['Medicamentos', 'Manipulação', 'Dermocosméticos', 'Higiene', 'Conveniência'],
  mercado: ['Hortifruti', 'Mercearia', 'Açougue', 'Bebidas', 'Limpeza', 'Padaria'],
  padaria: ['Pães', 'Confeitaria', 'Salgados', 'Café', 'Frios'],
  cafeteria: ['Café', 'Cappuccino', 'Bolos', 'Doces', 'Salgados', 'Brunch', 'Chá'],
  pet: ['Ração', 'Acessórios', 'Higiene', 'Farmácia pet'],
  conveniencia: ['Bebidas', 'Snacks', 'Tabacaria', 'Mercearia'],
  bebidas: ['Cervejas', 'Vinhos', 'Destilados', 'Não alcoólicas'],
};

export function SettingsPage() {
  const [profileData, setProfileData] = useState({
    segment: 'restaurante',
    restaurant_name: '', business_name: '', cnpj: '', phone: '',
    description: '', cuisine_type: '', category: '',
    delivery_time: '', delivery_fee: 0, minimum_order: 0,
    address_street: '', address_number: '', address_complement: '',
    address_neighborhood: '', address_city: '', address_state: '',
    address_zipcode: '', logo_url: '', is_open: false,
    payout_frequency: 'weekly',
    bank_name: '', bank_agency: '',
    bank_account_number: '', bank_account_type: 'corrente',
    pix_key: '', pix_key_type: '', mp_account_id: '', delivery_type: 'platform',
    accepts_cash: true,
    opening_hours: null, hours_auto: false,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  // Guarda o último estado salvo pra poder descartar alterações no "Cancelar"
  const [savedSnapshot, setSavedSnapshot] = useState(null);
  const { addToast } = useToast();
  const { updateProfileInContext } = useProfile();

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authService.getProfile();
      if (response && response.data) {
        const profile = response.data;
        // payout_frequency é sempre semanal por ora (form mostra campo fixo)
        const merged = { ...profileData, ...profile, is_open: profile.is_open ?? false, payout_frequency: 'weekly' };
        setProfileData(merged);
        setSavedSnapshot(merged);
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
  }, [addToast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData(prevData => {
      const next = { ...prevData, [name]: type === 'checkbox' ? checked : value };
      // Ao TROCAR DE SEGMENTO, descarta os tipos que não pertencem ao novo.
      // Sem isso os tipos antigos ficavam grudados no cadastro (uma farmácia
      // continuava marcada como "Hambúrguer", e esse tipo aparecia no filtro do
      // cliente dentro do segmento errado).
      if (name === 'segment') {
        const permitidos = TYPES_BY_SEGMENT[value] || [];
        const mantidos = (prevData.cuisine_type || '')
          .split(',').map((s) => s.trim()).filter(Boolean)
          .filter((t) => permitidos.includes(t));
        next.cuisine_type = mantidos.join(', ');
      }
      return next;
    });
  };

  // "Tipo" é multi-seleção guardada em cuisine_type como texto separado por
  // vírgula (ex.: "Pizza, Lanches"). O cliente filtra por "contém", então quem
  // marca Pizza E Lanche aparece nos dois.
  const cuisineList = (profileData.cuisine_type || '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  const toggleCuisine = (t) => {
    setProfileData((prev) => {
      const list = (prev.cuisine_type || '').split(',').map((s) => s.trim()).filter(Boolean);
      const next = list.includes(t) ? list.filter((x) => x !== t) : [...list, t];
      return { ...prev, cuisine_type: next.join(', ') };
    });
  };

  // CEP -> ViaCEP: preenche rua/bairro/cidade/UF automaticamente. A cidade e a
  // UF vêm do "localidade"/"uf" do ViaCEP (nome oficial dos Correios), então
  // ficam travadas no form. É o que garante que "Lages" não vire "LAGES/Lajes".
  const handleCepChange = async (e) => {
    const digits = (e.target.value || '').replace(/\D/g, '').slice(0, 8);
    const masked = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setProfileData(prev => ({ ...prev, address_zipcode: masked }));
    if (digits.length !== 8) return;
    try {
      setCepLoading(true);
      const resp = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await resp.json();
      if (data?.erro) {
        addToast('warning', 'CEP não encontrado. Confira o número.');
        return;
      }
      setProfileData(prev => ({
        ...prev,
        // logradouro/bairro só vêm em CEP de rua; em cidades menores podem vir
        // vazios — nesse caso mantém o que o dono já tinha digitado.
        address_street: data.logradouro || prev.address_street,
        address_neighborhood: data.bairro || prev.address_neighborhood,
        address_city: data.localidade || prev.address_city,
        address_state: (data.uf || prev.address_state || '').toUpperCase(),
      }));
      addToast('success', 'Endereço preenchido pelo CEP. Confira o número.');
    } catch {
      addToast('warning', 'Não consegui consultar o CEP agora. Tente de novo.');
    } finally {
      setCepLoading(false);
    }
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

      // Geocodifica o endereço para lat/lng (necessário para o cálculo de frete
      // por distância e para o restaurante poder ficar Aberto). Tenta uma cadeia
      // de fallback (rua → bairro+cidade → cidade) para nunca salvar sem
      // coordenadas — o que antes travava o restaurante no gate sem saída.
      const geo = await geocodeProfileAddress(finalProfileData);
      if (geo) {
        finalProfileData.latitude = geo.lat;
        finalProfileData.longitude = geo.lng;
      } else {
        const jaTinhaCoords =
          Number.isFinite(Number(finalProfileData.latitude)) &&
          Number.isFinite(Number(finalProfileData.longitude));
        if (!jaTinhaCoords) {
          addToast('error', 'Não consegui localizar seu endereço no mapa. Confira a Cidade e o Estado (UF) e salve novamente.');
        }
      }

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
        const merged = { ...profileData, ...updatedProfile };

        setProfileData(merged);
        setSavedSnapshot(merged);
        if (updatedProfile.logo_url) {
          setLogoPreview(updatedProfile.logo_url);
        }
        updateProfileInContext(updatedProfile);

        // Este é o único toast de sucesso, exibido no final de todo o processo.
        addToast('success', "Perfil atualizado com sucesso!");
        setLogoFile(null);
        setIsEditing(false);
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

  const handleCancelEdit = () => {
    if (savedSnapshot) {
      setProfileData(savedSnapshot);
      setLogoPreview(savedSnapshot.logo_url || '');
    }
    setLogoFile(null);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        <div className="h-8 bg-gray-200 rounded w-64 mb-8 animate-pulse"></div>
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-6 sm:mb-8 max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-800">Configurações do Restaurante</h1>
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors min-h-[44px]"
          >
            Editar Perfil
          </button>
        )}
      </div>
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-8 max-w-4xl mx-auto">
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
                {isEditing && (
                  <div>
                    <label htmlFor="logo-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <span>Mudar foto</span>
                      <input id="logo-upload" name="logo-upload" type="file" className="sr-only" accept="image/*" onChange={handleLogoChange} />
                    </label>
                  </div>
                )}
              </div>
            </div>
            
            {/* Secção de Informações Gerais */}
            <div className="border-t pt-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Informações Gerais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="restaurant_name" className="block text-sm font-medium text-gray-700">Nome do Restaurante</label>
                  <input type="text" name="restaurant_name" id="restaurant_name" value={profileData.restaurant_name || ''} onChange={handleChange} disabled={!isEditing} required className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
                  <input type="tel" name="phone" id="phone" value={profileData.phone || ''} onChange={handleChange} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                </div>
                <div>
                  <label htmlFor="segment" className="block text-sm font-medium text-gray-700">Segmento</label>
                  <select name="segment" id="segment" value={profileData.segment || 'restaurante'} onChange={handleChange} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                    {SEGMENTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Como você aparece no app do cliente (filtro do topo).</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {(profileData.segment || 'restaurante') === 'restaurante' ? 'Tipo de cozinha' : 'Tipo'}{' '}
                    <span className="text-gray-400 font-normal">(marque todos que se aplicam)</span>
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(TYPES_BY_SEGMENT[profileData.segment || 'restaurante'] || []).map((t) => {
                      const selected = cuisineList.includes(t);
                      return (
                        <button
                          type="button"
                          key={t}
                          disabled={!isEditing}
                          onClick={() => toggleCuisine(t)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'} ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                  {cuisineList.length === 0 && <p className="text-xs text-amber-600 mt-1">Selecione ao menos um — é como o cliente te encontra no filtro.</p>}
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição Curta do Restaurante</label>
                  <textarea name="description" id="description" rows="3" value={profileData.description || ''} onChange={handleChange} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
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
                    <input type="radio" name="delivery_type" value="platform" checked={profileData.delivery_type === 'platform'} onChange={handleChange} disabled={!isEditing} className="form-radio h-4 w-4 text-indigo-600"/>
                    <span className="ml-2 text-gray-800">Entrega da Plataforma (frete dinâmico)</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="delivery_type" value="own" checked={profileData.delivery_type === 'own'} onChange={handleChange} disabled={!isEditing} className="form-radio h-4 w-4 text-indigo-600"/>
                    <span className="ml-2 text-gray-800">Entrega Própria (frete fixo)</span>
                  </label>
                </div>
              </div>
              {/* Limite de itens: vale nos DOIS tipos de entrega — quem carrega
                  a compra é uma moto de qualquer jeito. Pensado pra mercado. */}
              <div className="mb-6">
                <label htmlFor="max_order_items" className="block text-sm font-medium text-gray-700">
                  Máximo de itens por pedido
                </label>
                <input
                  type="number" name="max_order_items" id="max_order_items"
                  min="0" step="1" placeholder="Sem limite"
                  value={profileData.max_order_items ?? ''}
                  onChange={handleChange} disabled={!isEditing}
                  className="mt-1 block w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
                <p className="mt-1 text-xs text-gray-600">
                  O cliente não consegue fechar um pedido acima desse número de unidades.
                  Serve pra compra grande que não cabe na moto — útil em mercado,
                  pet shop e conveniência. Deixe em branco se não precisa de limite.
                </p>
              </div>

              {profileData.delivery_type === 'own' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border-l-4 border-indigo-200 bg-indigo-50 rounded-md">
                  <div>
                    <label htmlFor="delivery_time" className="block text-sm font-medium text-gray-700">Tempo de Entrega (ex: 30-45 min)</label>
                    <input type="text" name="delivery_time" id="delivery_time" value={profileData.delivery_time || ''} onChange={handleChange} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                  </div>
                  <div>
                    <label htmlFor="delivery_fee" className="block text-sm font-medium text-gray-700">Taxa de Entrega (R$)</label>
                    <input type="number" name="delivery_fee" id="delivery_fee" step="0.01" value={profileData.delivery_fee || 0} onChange={handleChange} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                  </div>
                  <div>
                    <label htmlFor="minimum_order" className="block text-sm font-medium text-gray-700">Pedido Mínimo (R$)</label>
                    <input type="number" name="minimum_order" id="minimum_order" step="0.01" value={profileData.minimum_order || 0} onChange={handleChange} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                  </div>
                  {/* Trava de dinheiro: como a taxa é FIXA, sem um limite de
                      distância um pedido lá longe sai do bolso da loja. */}
                  <div className="md:col-span-3">
                    <label htmlFor="own_delivery_radius_km" className="block text-sm font-medium text-gray-700">
                      Até quantos km você entrega?
                    </label>
                    <input
                      type="number" name="own_delivery_radius_km" id="own_delivery_radius_km"
                      step="0.5" min="0" placeholder="Ex: 6"
                      value={profileData.own_delivery_radius_km ?? ''}
                      onChange={handleChange} disabled={!isEditing}
                      className="mt-1 block w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    />
                    <p className="mt-1 text-xs text-gray-600">
                      Sua taxa é <strong>fixa em qualquer distância</strong>. Quem estiver
                      além desse limite não vê a sua loja e não consegue pedir — assim
                      você não recebe um pedido longe demais pagando o mesmo frete.
                      Deixe em branco para atender toda a área da Inksa.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Horários de funcionamento */}
            <OpeningHoursEditor
              value={profileData.opening_hours}
              onChange={(v) => setProfileData((prev) => ({ ...prev, opening_hours: v }))}
              auto={profileData.hours_auto}
              onAutoChange={(v) => setProfileData((prev) => ({ ...prev, hours_auto: v }))}
            />

            {/* Aceitar dinheiro */}
            <div className="border-t pt-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Formas de Pagamento</h2>
              <label className="flex items-center gap-3 cursor-pointer w-fit">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="accepts_cash"
                    checked={profileData.accepts_cash ?? true}
                    onChange={handleChange} disabled={!isEditing}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${(profileData.accepts_cash ?? true) ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${(profileData.accepts_cash ?? true) ? 'translate-x-5' : ''}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">Aceitar pagamento em dinheiro</span>
              </label>
              <p className="text-xs text-gray-500 mt-2 ml-0">
                Se desativado, a opção "Dinheiro" não será exibida para os clientes no checkout.
              </p>
            </div>

            {/* Secção de Endereço */}
            <div className="border-t pt-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Endereço do Restaurante</h2>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                <div className="col-span-6 md:col-span-3">
                  <label htmlFor="address_zipcode" className="block text-sm font-medium text-gray-700">
                    CEP {cepLoading && <span className="text-indigo-600 font-normal">buscando…</span>}
                  </label>
                  <input type="text" name="address_zipcode" inputMode="numeric" maxLength="9" placeholder="00000-000" value={profileData.address_zipcode || ''} onChange={handleCepChange} disabled={!isEditing} className="mt-1 w-full px-3 py-2 text-base border border-gray-300 rounded-md"/>
                  <p className="text-xs text-gray-500 mt-1">Preenche rua, bairro, cidade e UF automaticamente.</p>
                </div>
                <div className="col-span-6 md:col-span-4">
                  <label htmlFor="address_street" className="block text-sm font-medium text-gray-700">Rua</label>
                  <input type="text" name="address_street" value={profileData.address_street || ''} onChange={handleChange} disabled={!isEditing} className="mt-1 w-full px-3 py-2 text-base border border-gray-300 rounded-md"/>
                </div>
                <div className="col-span-6 md:col-span-2">
                  <label htmlFor="address_number" className="block text-sm font-medium text-gray-700">Número</label>
                  <input type="text" name="address_number" value={profileData.address_number || ''} onChange={handleChange} disabled={!isEditing} className="mt-1 w-full px-3 py-2 text-base border border-gray-300 rounded-md"/>
                </div>
                <div className="col-span-6">
                  <label htmlFor="address_complement" className="block text-sm font-medium text-gray-700">Complemento (opcional)</label>
                  <input type="text" name="address_complement" value={profileData.address_complement || ''} onChange={handleChange} disabled={!isEditing} className="mt-1 w-full px-3 py-2 text-base border border-gray-300 rounded-md"/>
                </div>
                <div className="col-span-6 md:col-span-3">
                  <label htmlFor="address_neighborhood" className="block text-sm font-medium text-gray-700">Bairro</label>
                  <input type="text" name="address_neighborhood" value={profileData.address_neighborhood || ''} onChange={handleChange} disabled={!isEditing} className="mt-1 w-full px-3 py-2 text-base border border-gray-300 rounded-md"/>
                </div>
                <div className="col-span-6 md:col-span-2">
                  <label htmlFor="address_city" className="block text-sm font-medium text-gray-700">Cidade</label>
                  <input type="text" name="address_city" value={profileData.address_city || ''} readOnly disabled={!isEditing} title="Preenchido pelo CEP" className="mt-1 w-full px-3 py-2 text-base border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"/>
                  <p className="text-xs text-gray-500 mt-1">Vem do CEP</p>
                </div>
                <div className="col-span-6 md:col-span-1">
                  <label htmlFor="address_state" className="block text-sm font-medium text-gray-700">UF</label>
                  <input type="text" name="address_state" maxLength="2" value={profileData.address_state || ''} readOnly disabled={!isEditing} title="Preenchido pelo CEP" className="mt-1 w-full px-3 py-2 text-base border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"/>
                  <p className="text-xs text-gray-500 mt-1">Vem do CEP</p>
                </div>
              </div>
            </div>

            {/* Secção de Informações de Pagamento */}
            <div className="border-t pt-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Informações de Pagamento</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Frequência de Pagamento</label>
                  {/* Só semanal por ora — padrão do mercado e mais previsível.
                      Quinzenal/mensal podem voltar depois (o backend já aceita). */}
                  <div className="mt-1 flex items-center gap-2 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-base text-gray-700">
                    <span className="font-medium">Semanal</span>
                    <span className="text-xs text-gray-400">· seus repasses caem toda semana</span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700">Nome do Banco</label>
                  <input type="text" name="bank_name" value={profileData.bank_name || ''} onChange={handleChange} disabled={!isEditing} className="mt-1 w-full px-3 py-2 text-base border border-gray-300 rounded-md"/>
                </div>
                <div>
                  <label htmlFor="bank_agency" className="block text-sm font-medium text-gray-700">Agência</label>
                  <input type="text" name="bank_agency" value={profileData.bank_agency || ''} onChange={handleChange} disabled={!isEditing} className="mt-1 w-full px-3 py-2 text-base border border-gray-300 rounded-md"/>
                </div>
                <div>
                  <label htmlFor="bank_account_number" className="block text-sm font-medium text-gray-700">Número da Conta (com dígito)</label>
                  <input type="text" name="bank_account_number" value={profileData.bank_account_number || ''} onChange={handleChange} disabled={!isEditing} className="mt-1 w-full px-3 py-2 text-base border border-gray-300 rounded-md"/>
                </div>
                <div>
                  <label htmlFor="bank_account_type" className="block text-sm font-medium text-gray-700">Tipo de Conta</label>
                   <select name="bank_account_type" id="bank_account_type" value={profileData.bank_account_type || 'corrente'} onChange={handleChange} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="corrente">Conta Corrente</option>
                      <option value="poupanca">Conta Poupança</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="pix_key" className="block text-sm font-medium text-gray-700">Chave PIX</label>
                  <input type="text" name="pix_key" value={profileData.pix_key || ''} onChange={handleChange} disabled={!isEditing} className="mt-1 w-full px-3 py-2 text-base border border-gray-300 rounded-md"/>
                </div>
                <div>
                  <label htmlFor="pix_key_type" className="block text-sm font-medium text-gray-700">Tipo da chave PIX</label>
                  <select name="pix_key_type" id="pix_key_type" value={profileData.pix_key_type || ''} onChange={handleChange} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Selecione…</option>
                    <option value="CPF">CPF</option>
                    <option value="CNPJ">CNPJ</option>
                    <option value="EMAIL">E-mail</option>
                    <option value="PHONE">Telefone (celular)</option>
                    <option value="EVP">Chave aleatória</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Necessário para o repasse automático via PIX cair sem erro.</p>
                </div>
              </div>
            </div>
            
            {isEditing && (
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 w-full sm:w-48 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed min-h-[44px]">
                  {isSaving ? <><Loader size={18} className="animate-spin" /> A guardar...</> : <><Save size={18} /> Guardar Alterações</>}
                </button>
              </div>
            )}
        </form>
      </div>
    </div>
  );
}
