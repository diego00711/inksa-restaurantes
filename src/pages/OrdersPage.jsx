// src/pages/OrdersPage.jsx (VERSÃO FINAL COM 6 COLUNAS)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { orderService } from '../services/orderService.js';
import OrderCard from '../components/OrderCard'; 
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { PickupConfirmationModal } from '../components/PickupConfirmationModal';
import { useToast } from '../context/ToastContext.jsx';
import { SlidersHorizontal, Trash2 } from 'lucide-react';

export function OrdersPage() {
  const [allOrders, setAllOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Estados para modal de detalhes
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para modal de confirmação de retirada
  const [selectedOrderForPickup, setSelectedOrderForPickup] = useState(null);
  const [showPickupModal, setShowPickupModal] = useState(false);

  const fetchOrders = useCallback(async (currentFilters) => {
    try {
      const params = new URLSearchParams();
      if (currentFilters.startDate) params.append('start_date', currentFilters.startDate);
      if (currentFilters.endDate) params.append('end_date', currentFilters.endDate);
      params.append('sort_by', currentFilters.sortBy);
      params.append('sort_order', currentFilters.sortOrder);
      
      const ordersArray = await orderService.getOrders(params);
      setAllOrders(ordersArray || []);
    } catch (err) {
      addToast(err.message || "Erro ao carregar pedidos.", 'error');
      setAllOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchOrders(filters);
    const intervalId = setInterval(() => {
      console.log('Restaurante: Verificando por novos pedidos...');
      fetchOrders(filters);
    }, 10000); 
    return () => clearInterval(intervalId);
  }, [fetchOrders, filters]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      addToast(`Status do pedido atualizado para ${newStatus}!`, 'success');
      fetchOrders(filters); 
    } catch (err) {
      addToast(`Falha ao atualizar o status: ${err.message}`, 'error');
    }
  };

  const handleRemoveOrder = async (orderId) => {
    if (!window.confirm('Deseja remover este pedido do painel? Ele não aparecerá mais aqui, mas ficará no histórico para análises.')) {
      return;
    }
    
    try {
      await orderService.updateOrderStatus(orderId, 'Arquivado');
      addToast('Pedido removido do painel!', 'success');
      fetchOrders(filters);
    } catch (err) {
      addToast(`Erro ao remover pedido: ${err.message}`, 'error');
    }
  };

  const handleOpenPickupModal = (order) => {
    setSelectedOrderForPickup(order);
    setShowPickupModal(true);
  };

  const handleClosePickupModal = () => {
    setSelectedOrderForPickup(null);
    setShowPickupModal(false);
  };

  const handlePickupSuccess = () => {
    fetchOrders(filters);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleApplyFilters = () => { 
    fetchOrders(filters); 
  };
  
  const handleClearFilters = () => {
    const defaultFilters = { startDate: '', endDate: '', sortBy: 'created_at', sortOrder: 'desc' };
    setFilters(defaultFilters);
    fetchOrders(defaultFilters);
  };

  // ✅ CORRIGIDO: 6 COLUNAS
  const columns = useMemo(() => {
    const activeOrders = allOrders.filter(o => 
      o.status !== 'Arquivado' && o.status !== 'archived'
    );
    
    const novos = activeOrders.filter(o => o.status === 'Pendente' || o.status === 'pending');
    const emPreparo = activeOrders.filter(o => ['Aceito', 'Preparando', 'accepted', 'preparing'].includes(o.status));
    const prontos = activeOrders.filter(o => o.status === 'Pronto' || o.status === 'ready');
    
    // ✅ NOVA COLUNA: Aguardando Retirada
    const aguardandoRetirada = activeOrders.filter(o => 
      o.status === 'Aguardando Retirada' || 
      o.status === 'accepted_by_delivery'
    );
    
    const saiuParaEntrega = activeOrders.filter(o => 
      o.status === 'Saiu para Entrega' || 
      o.status === 'delivering' ||
      o.status === 'Entregando'
    );
    
    const entregues = activeOrders.filter(o => 
      o.status === 'Entregue' || 
      o.status === 'delivered'
    );
    
    return { novos, emPreparo, prontos, aguardandoRetirada, saiuParaEntrega, entregues };
  }, [allOrders]);

  const handleViewOrderDetails = (order) => { 
    setSelectedOrder(order); 
    setIsModalOpen(true); 
  };
  
  const handleCloseModal = () => { 
    setSelectedOrder(null); 
    setIsModalOpen(false); 
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Painel de Pedidos</h1>
        <button 
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} 
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md shadow-sm hover:bg-gray-50"
        >
          <SlidersHorizontal size={16} />
          {showAdvancedFilters ? 'Ocultar Filtros' : 'Filtros Avançados'}
        </button>
      </div>

      {/* Filtros Avançados */}
      {showAdvancedFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">De</label>
              <input 
                type="date" 
                name="startDate" 
                id="startDate" 
                value={filters.startDate} 
                onChange={handleInputChange} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Até</label>
              <input 
                type="date" 
                name="endDate" 
                id="endDate" 
                value={filters.endDate} 
                onChange={handleInputChange} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
              />
            </div>
            <div>
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">Ordenar por</label>
              <select 
                name="sortBy" 
                id="sortBy" 
                value={filters.sortBy} 
                onChange={handleInputChange} 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="created_at">Data</option>
                <option value="total_amount">Valor</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleApplyFilters} 
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Aplicar
              </button>
              <button 
                onClick={handleClearFilters} 
                title="Limpar Filtros" 
                className="p-2 border rounded-md hover:bg-gray-100"
              >
                🧹
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Grid de Pedidos com 6 COLUNAS */}
      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 overflow-x-auto">
        {isLoading ? (
          <p className="text-gray-500 text-center col-span-6 py-10">Carregando...</p>
        ) : (
          <>
            {/* Coluna 1: Novos Pedidos */}
            <div className="bg-blue-50 rounded-lg p-3 flex flex-col min-w-[200px]">
              <h2 className="text-sm font-bold text-blue-700 mb-3">
                📥 Novos ({columns.novos.length})
              </h2>
              <div className="space-y-3 overflow-y-auto">
                {columns.novos.length > 0 ? (
                  columns.novos.map(order => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      onUpdateStatus={handleUpdateStatus} 
                      onViewDetails={handleViewOrderDetails}
                      onConfirmPickup={handleOpenPickupModal}
                    />
                  ))
                ) : (
                  <p className="text-xs text-center text-gray-500 pt-4">Nenhum pedido novo.</p>
                )}
              </div>
            </div>

            {/* Coluna 2: Em Preparo */}
            <div className="bg-orange-50 rounded-lg p-3 flex flex-col min-w-[200px]">
              <h2 className="text-sm font-bold text-orange-700 mb-3">
                👨‍🍳 Preparo ({columns.emPreparo.length})
              </h2>
              <div className="space-y-3 overflow-y-auto">
                {columns.emPreparo.length > 0 ? (
                  columns.emPreparo.map(order => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      onUpdateStatus={handleUpdateStatus} 
                      onViewDetails={handleViewOrderDetails}
                      onConfirmPickup={handleOpenPickupModal}
                    />
                  ))
                ) : (
                  <p className="text-xs text-center text-gray-500 pt-4">Nenhum pedido em preparo.</p>
                )}
              </div>
            </div>

            {/* Coluna 3: Prontos */}
            <div className="bg-yellow-50 rounded-lg p-3 flex flex-col min-w-[200px]">
              <h2 className="text-sm font-bold text-yellow-700 mb-3">
                📦 Prontos ({columns.prontos.length})
              </h2>
              <div className="space-y-3 overflow-y-auto">
                {columns.prontos.length > 0 ? (
                  columns.prontos.map(order => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      onUpdateStatus={handleUpdateStatus} 
                      onViewDetails={handleViewOrderDetails}
                      onConfirmPickup={handleOpenPickupModal}
                    />
                  ))
                ) : (
                  <p className="text-xs text-center text-gray-500 pt-4">Nenhum pedido pronto.</p>
                )}
              </div>
            </div>

            {/* ✅ NOVA Coluna 4: Aguardando Retirada */}
            <div className="bg-pink-50 rounded-lg p-3 flex flex-col min-w-[200px]">
              <h2 className="text-sm font-bold text-pink-700 mb-3">
                ⏳ Aguardando ({columns.aguardandoRetirada.length})
              </h2>
              <div className="space-y-3 overflow-y-auto">
                {columns.aguardandoRetirada.length > 0 ? (
                  columns.aguardandoRetirada.map(order => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      onUpdateStatus={handleUpdateStatus} 
                      onViewDetails={handleViewOrderDetails}
                      onConfirmPickup={handleOpenPickupModal}
                    />
                  ))
                ) : (
                  <p className="text-xs text-center text-gray-500 pt-4">Nenhum pedido aguardando.</p>
                )}
              </div>
            </div>

            {/* Coluna 5: Em Rota */}
            <div className="bg-purple-50 rounded-lg p-3 flex flex-col min-w-[200px]">
              <h2 className="text-sm font-bold text-purple-700 mb-3">
                🚗 Em Rota ({columns.saiuParaEntrega.length})
              </h2>
              <div className="space-y-3 overflow-y-auto">
                {columns.saiuParaEntrega.length > 0 ? (
                  columns.saiuParaEntrega.map(order => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      onUpdateStatus={handleUpdateStatus} 
                      onViewDetails={handleViewOrderDetails}
                      onConfirmPickup={handleOpenPickupModal}
                    />
                  ))
                ) : (
                  <p className="text-xs text-center text-gray-500 pt-4">Nenhum pedido em rota.</p>
                )}
              </div>
            </div>

            {/* Coluna 6: Entregues (com botão Remover) */}
            <div className="bg-green-50 rounded-lg p-3 flex flex-col min-w-[200px]">
              <h2 className="text-sm font-bold text-green-700 mb-3">
                ✅ Entregues ({columns.entregues.length})
              </h2>
              <div className="space-y-3 overflow-y-auto">
                {columns.entregues.length > 0 ? (
                  columns.entregues.map(order => (
                    <div key={order.id}>
                      <OrderCard 
                        order={order} 
                        onUpdateStatus={handleUpdateStatus} 
                        onViewDetails={handleViewOrderDetails}
                        onConfirmPickup={handleOpenPickupModal}
                      />
                      {/* Botão Remover */}
                      <button
                        onClick={() => handleRemoveOrder(order.id)}
                        className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-md transition-colors border border-red-200"
                        title="Remover do painel"
                      >
                        <Trash2 size={12} />
                        Remover
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-center text-gray-500 pt-4">Nenhum pedido entregue.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de Detalhes */}
      {isModalOpen && selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={handleCloseModal} 
        />
      )}

      {/* Modal de Confirmação de Retirada */}
      {showPickupModal && selectedOrderForPickup && (
        <PickupConfirmationModal
          order={selectedOrderForPickup}
          isOpen={showPickupModal}
          onClose={handleClosePickupModal}
          onSuccess={handlePickupSuccess}
        />
      )}
    </div>
  );
}
