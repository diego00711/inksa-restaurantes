// src/pages/AnalyticsPage.jsx - VERSÃO FINAL COM GRÁFICO

import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, PieChart } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { useToast } from '../context/ToastContext.jsx';
import { SalesChart } from '../components/SalesChart'; // ✅ 1. Importa o novo componente de gráfico

export function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await analyticsService.getAnalytics();
        setAnalyticsData(data);
      } catch (err) {
        console.error("Erro ao buscar dados de analytics:", err);
        setError(err.message);
        addToast(err.message || "Não foi possível carregar os dados.", 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [addToast]);

  // O JSX para loading, error e os cards continua o mesmo...
  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard de Analytics</h1>
        <p className="text-lg text-gray-600">Carregando dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard de Analytics</h1>
        <p className="text-lg text-red-500">Erro ao carregar dados: {error}</p>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard de Analytics</h1>
        <p className="text-lg text-gray-600">Nenhum dado de analytics disponível.</p>
      </div>
    );
  }

  const formattedTotalSales = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(analyticsData.total_vendas || 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard de Analytics</h1>

      {/* Cards de Resumo (sem alteração) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total de Vendas</p>
            <p className="text-3xl font-bold text-primary mt-1">{formattedTotalSales}</p>
          </div>
          <TrendingUp size={48} className="text-orange-300" />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total de Pedidos Concluídos</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{analyticsData.pedidos_concluidos || 0}</p>
          </div>
          <ShoppingBag size={48} className="text-green-300" />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Item Mais Vendido</p>
            <p className="text-xl font-bold text-purple-600 mt-1">{analyticsData.item_mais_vendido || 'N/A'}</p>
          </div>
          <PieChart size={48} className="text-purple-300" />
        </div>
      </div>

      {/* ✅ 2. Seção do Gráfico */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Vendas nos Últimos 7 Dias</h2>
        {analyticsData.vendas_por_dia && analyticsData.vendas_por_dia.length > 0 ? (
          // Renderiza o componente do gráfico, passando os dados
          <SalesChart data={analyticsData.vendas_por_dia} />
        ) : (
          // Mensagem exibida se não houver dados de vendas
          <p className="text-gray-500">Não há dados de vendas nos últimos 7 dias para exibir.</p>
        )}
      </div>
    </div>
  );
}
