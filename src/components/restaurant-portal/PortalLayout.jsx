// Local: src/components/restaurant-portal/PortalLayout.jsx - VERSÃO CORRIGIDA

import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { ListOrdered, Utensils, Settings, LogOut, BarChart2, Tag, Trophy, Star, DollarSign, Menu, X, ChefHat } from 'lucide-react';
import { authService } from '../../services/authService.js';
import { useProfile } from '../../context/ProfileContext';
import { useToast } from '../../context/ToastContext.jsx';

export function PortalLayout() {
  const location = useLocation();
  const { profile, loading, updateProfileInContext } = useProfile();
  const { addToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Pedidos', icon: ListOrdered, path: '/pedidos' },
    { name: 'Cozinha (KDS)', icon: ChefHat, path: '/cozinha' },
    { name: 'Cardápio', icon: Utensils, path: '/cardapio' },
    { name: 'Analytics', icon: BarChart2, path: '/analytics' },
    { name: 'Avaliações', icon: Star, path: '/avaliacoes' },
    { name: 'Gamificação', icon: Trophy, path: '/gamificacao' },
    { name: 'Financeiro', icon: DollarSign, path: '/financeiro' },
    { name: 'Configurações', icon: Settings, path: '/configuracoes' },
    { name: 'Categorias', icon: Tag, path: '/categorias' },
  ];

  // ✅ HANDLELOGOUT CORRIGIDO - AGORA É ASSÍNCRONO E CHAMA O BACKEND!
  const handleLogout = async () => {
    try {
      addToast('info', 'Saindo...');
      await authService.logout(); // Agora aguarda a chamada ao backend
      // O authService.logout() já faz o redirecionamento
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      addToast('error', 'Erro ao sair. Redirecionando...');
      // Força redirecionamento mesmo com erro
      window.location.href = '/login';
    }
  };

  const handleToggleIsOpen = async () => {
    if (loading || !profile) return;
    const newIsOpenStatus = !profile.is_open;
    try {
      addToast('info', `A atualizar status para ${newIsOpenStatus ? 'Aberto' : 'Fechado'}...`);
      const updatedProfileResponse = await authService.updateProfile({ is_open: newIsOpenStatus });
      if (updatedProfileResponse?.data) {
        updateProfileInContext(updatedProfileResponse.data);
      }
      addToast('success', `Restaurante agora está ${newIsOpenStatus ? 'Aberto' : 'Fechado'}!`);
    } catch (error) {
      console.error("Erro ao alternar status 'is_open':", error);
      addToast('error', error.message || "Falha ao atualizar status do restaurante.");
    }
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-orange-50 font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 sm:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed sm:static inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white flex flex-col p-4 shadow-lg transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0`}>
        <div className="flex items-center gap-3 mb-8 p-2 border-b border-gray-700 pb-4">
          <Link to="/pedidos" className="flex items-center gap-3 w-full" onClick={closeSidebar}>
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
            <Link
              to={item.path}
              key={item.name}
              onClick={closeSidebar}
              className={`flex items-center py-2.5 px-4 rounded-lg transition-colors text-gray-300 hover:bg-gray-700 hover:text-white min-h-[44px] ${location.pathname.startsWith(item.path) ? 'bg-primary text-white' : ''}`}
            >
              <item.icon className="mr-3 h-5 w-5 shrink-0" />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center py-2.5 px-4 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors min-h-[44px]"
          >
            <LogOut className="mr-3 h-5 w-5 shrink-0" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white p-4 shadow-sm flex items-center justify-between z-10 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {/* Botão hambúrguer — visível apenas em mobile */}
            <button
              className="sm:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">
              {navItems.find(item => location.pathname.startsWith(item.path))?.name || 'Painel'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-gray-600 text-sm font-medium">
              Bem-vindo, {loading ? '...' : (profile?.restaurant_name || 'Restaurante')}!
            </span>
            {/* Status pill visible on mobile (sidebar is hidden) */}
            <span className={`sm:hidden inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${profile?.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <span className={`w-2 h-2 rounded-full ${profile?.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              {profile?.is_open ? 'Aberto' : 'Fechado'}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
