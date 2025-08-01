// Local: src/components/restaurant-portal/PortalLayout.jsx

import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { ListOrdered, Utensils, Settings, LogOut, BarChart2, Tag } from 'lucide-react';
import { authService } from '../../services/authService.js';
import { useProfile } from '../../context/ProfileContext'; 
import { useToast } from '../../context/ToastContext.jsx'; 

export function PortalLayout() {
  const location = useLocation();
  const { profile, loading, updateProfileInContext } = useProfile(); 
  const { addToast } = useToast();

  const navItems = [
    { name: 'Pedidos', icon: ListOrdered, path: '/pedidos' },
    { name: 'Cardápio', icon: Utensils, path: '/cardapio' },
    { name: 'Analytics', icon: BarChart2, path: '/analytics' }, 
    { name: 'Configurações', icon: Settings, path: '/configuracoes' },
    { name: 'Categorias', icon: Tag, path: '/categorias' },
  ];

  const handleLogout = () => {
    authService.logout();
  };

  const handleToggleIsOpen = async () => {
    if (loading || !profile) return;
    const newIsOpenStatus = !profile.is_open;

    try {
      // ✅ CORREÇÃO: Ordem correta dos parâmetros -> (tipo, mensagem)
      addToast('info', `A atualizar status para ${newIsOpenStatus ? 'Aberto' : 'Fechado'}...`);
      
      const updatedProfileResponse = await authService.updateProfile({ is_open: newIsOpenStatus });
      
      console.log("Resposta completa recebida do backend:", updatedProfileResponse);
      console.log("Dados do perfil que serão salvos no context:", updatedProfileResponse.data);
      
      updateProfileInContext(updatedProfileResponse.data); 
      
      // ✅ CORREÇÃO: Ordem correta dos parâmetros -> (tipo, mensagem)
      addToast('success', `Restaurante agora está ${newIsOpenStatus ? 'Aberto' : 'Fechado'}!`);
      
    } catch (error) {
      console.error("Erro ao alternar status 'is_open':", error);
      // ✅ CORREÇÃO: Ordem correta dos parâmetros -> (tipo, mensagem)
      addToast('error', error.message || "Falha ao atualizar status do restaurante.");
    }
  };

  return (
    <div className="flex min-h-screen bg-orange-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col p-4 shadow-lg">
        <div className="flex items-center gap-3 mb-8 p-2 border-b border-gray-700 pb-4">
          <Link to="/pedidos" className="flex items-center gap-3 w-full">
            {loading ? (
              <div className="h-10 w-10 bg-gray-700 rounded-full animate-pulse"></div>
            ) : profile?.logo_url ? (
              <img src={profile.logo_url} alt="Logo do Restaurante" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center font-bold text-white">
                {profile?.restaurant_name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <span className="font-semibold text-lg truncate">
              {loading ? 'Carregando...' : (profile?.restaurant_name || 'Restaurante')}
            </span>
          </Link>
        </div>

        <div className="flex items-center justify-between px-4 py-2 mb-4 bg-gray-800 rounded-lg shadow-inner">
            <span className="text-gray-300 font-medium text-sm">Status:</span>
            {loading ? (
                <span className="text-gray-400 text-sm">Carregando...</span>
            ) : (
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        value=""
                        className="sr-only peer"
                        checked={profile?.is_open || false}
                        onChange={handleToggleIsOpen}
                        disabled={loading}
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-300">
                        {profile?.is_open ? 'Aberto' : 'Fechado'}
                    </span>
                </label>
            )}
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link to={item.path} key={item.name} className={`flex items-center py-2.5 px-4 rounded-lg transition-colors text-gray-300 hover:bg-gray-700 hover:text-white ${location.pathname.startsWith(item.path) ? 'bg-primary text-white' : ''}`}>
              <item.icon className="mr-3 h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-700">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center py-2.5 px-4 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>
      
      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white p-4 shadow-sm flex items-center justify-between z-10 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">
            {navItems.find(item => location.pathname.startsWith(item.path))?.name || 'Painel'}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-gray-600 text-sm font-medium">
              Bem-vindo, {loading ? '...' : (profile?.restaurant_name || 'Restaurante')}!
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}