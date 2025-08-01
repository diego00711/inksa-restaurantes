// src/pages/OrdersPage.jsx (CORRIGIDO)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// ✅ CORREÇÃO 1: Importando do novo orderService
import { orderService } from '../services/orderService.js';
import OrderCard from '../components/OrderCard'; 
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { useToast } from '../context/ToastContext.jsx';
import { SlidersHorizontal } from 'lucide-react';

export function OrdersPage() {
  const [allOrders, setAllOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast(); // Desestruturado corretamente

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const fetchOrders = useCallback(async (currentFilters) => {
    try {
      const params = new URLSearchParams();
      if (currentFilters.startDate) params.append('start_date', currentFilters.startDate);
      if (currentFilters.endDate) params.append('end_date', currentFilters.endDate);
      params.append('sort_by', currentFilters.sortBy);
      params.append('sort_order', currentFilters.sortOrder);
      
      // ✅ CORREÇÃO 2: Chamando a função do serviço correto
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
      // ✅ CORREÇÃO 3: Chamando a função do serviço correto
      await orderService.updateOrderStatus(orderId, newStatus);
      addToast(`Status do pedido atualizado para ${newStatus}!`, 'success');
      fetchOrders(filters); 
    } catch (err) {
      addToast(`Falha ao atualizar o status: ${err.message}`, 'error');
    }
  };

  // O resto do seu código (handlers, JSX, etc.) continua igual, pois já estava correto.
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  const handleApplyFilters = () => { fetchOrders(filters); };
  const handleClearFilters = () => {
    const defaultFilters = { startDate: '', endDate: '', sortBy: 'created_at', sortOrder: 'desc' };
    setFilters(defaultFilters);
    fetchOrders(defaultFilters);
  };
  const columns = useMemo(() => {
    const novos = allOrders.filter(o => o.status === 'Pendente');
    const emPreparo = allOrders.filter(o => ['Aceito', 'Em Preparo'].includes(o.status));
    const prontos = allOrders.filter(o => o.status === 'Pronto para Entrega');
    return { novos, emPreparo, prontos };
  }, [allOrders]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleViewOrderDetails = (order) => { setSelectedOrder(order); setIsModalOpen(true); };
  const handleCloseModal = () => { setSelectedOrder(null); setIsModalOpen(false); };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6"><h1 className="text-3xl font-bold text-gray-800">Painel de Pedidos</h1><button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md shadow-sm hover:bg-gray-50"><SlidersHorizontal size={16} />{showAdvancedFilters ? 'Ocultar Filtros' : 'Filtros Avançados'}</button></div>
      {showAdvancedFilters && (<div className="bg-white p-4 rounded-lg shadow-sm mb-6"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end"><div><label htmlFor="startDate" className="block text-sm font-medium text-gray-700">De</label><input type="date" name="startDate" id="startDate" value={filters.startDate} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" /></div><div><label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Até</label><input type="date" name="endDate" id="endDate" value={filters.endDate} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" /></div><div><label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">Ordenar por</label><select name="sortBy" id="sortBy" value={filters.sortBy} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"><option value="created_at">Data</option><option value="total_amount">Valor</option></select></div><div className="flex items-center gap-2"><button onClick={handleApplyFilters} className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Aplicar</button><button onClick={handleClearFilters} title="Limpar Filtros" className="p-2 border rounded-md hover:bg-gray-100">🧹</button></div></div></div>)}
      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (<p className="text-gray-500 text-center col-span-3 py-10">Carregando...</p>)
         : (
          <>
            <div className="bg-gray-100 rounded-lg p-4 flex flex-col"><h2 className="text-lg font-bold text-gray-700 mb-4">Novos Pedidos ({columns.novos.length})</h2><div className="space-y-4 overflow-y-auto">{columns.novos.length > 0 ? columns.novos.map(o => (<OrderCard key={o.id} order={o} onUpdateStatus={handleUpdateStatus} onViewDetails={handleViewOrderDetails}/>)) : <p className="text-sm text-center text-gray-500 pt-4">Nenhum pedido novo.</p>}</div></div>
            <div className="bg-gray-100 rounded-lg p-4 flex flex-col"><h2 className="text-lg font-bold text-gray-700 mb-4">Em Preparo ({columns.emPreparo.length})</h2><div className="space-y-4 overflow-y-auto">{columns.emPreparo.length > 0 ? columns.emPreparo.map(o => (<OrderCard key={o.id} order={o} onUpdateStatus={handleUpdateStatus} onViewDetails={handleViewOrderDetails}/>)) : <p className="text-sm text-center text-gray-500 pt-4">Nenhum pedido em preparo.</p>}</div></div>
            <div className="bg-gray-100 rounded-lg p-4 flex flex-col"><h2 className="text-lg font-bold text-gray-700 mb-4">Prontos para Entrega ({columns.prontos.length})</h2><div className="space-y-4 overflow-y-auto">{columns.prontos.length > 0 ? columns.prontos.map(o => (<OrderCard key={o.id} order={o} onUpdateStatus={handleUpdateStatus} onViewDetails={handleViewOrderDetails}/>)) : <p className="text-sm text-center text-gray-500 pt-4">Nenhum pedido pronto.</p>}</div></div>
          </>
        )}
      </div>
      {isModalOpen && selectedOrder && (<OrderDetailsModal order={selectedOrder} onClose={handleCloseModal} />)}
    </div>
  );
}