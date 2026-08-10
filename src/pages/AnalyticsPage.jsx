// src/pages/AnalyticsPage.jsx - VERSÃO CORRIGIDA

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  ShoppingBag, 
  PieChart, 
  DollarSign,
  Star,
  Clock,
  Users,
  RefreshCw,
  Calendar,
  Package,
  Lightbulb,
  Repeat,
  AlertTriangle
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { useToast } from '../context/ToastContext.jsx';
import { SalesChart } from '../components/SalesChart';

export function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { addToast } = useToast();

  const fetchAnalytics = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // ✅ CORRIGIDO: Passando dateRange para o serviço
      const data = await analyticsService.getAnalytics(dateRange);
      console.log('📊 Dados do analytics recebidos:', data);
      setAnalyticsData(data);

    } catch (err) {
      console.error("Erro ao buscar dados de analytics:", err);
      setError(err.message);
      addToast('error', err.message || "Não foi possível carregar os dados.");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, addToast]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchAnalytics();
      addToast('success', 'Dados atualizados com sucesso!');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-800">Dashboard de Analytics</h1>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-800 mb-8">Dashboard de Analytics</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Erro ao carregar dados</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={handleRefresh}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-800 mb-8">Dashboard de Analytics</h1>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <PieChart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg text-gray-600">Nenhum dado de analytics disponível.</p>
          <p className="text-sm text-gray-500 mt-2">Comece a receber pedidos para ver suas estatísticas aqui.</p>
        </div>
      </div>
    );
  }

  const formattedTotalSales = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(analyticsData.total_vendas || 0);

  const metricas = analyticsData.metricas_extras || {};
  const insights = analyticsData.insights || {};
  const topItens = insights.top_itens || [];
  const porHora = insights.vendas_por_hora || [];
  const porDiaSemana = insights.vendas_por_dia_semana || [];

  const brl = (v) => new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL'
  }).format(v || 0);

  const maxItemQtd = Math.max(1, ...topItens.map((i) => i.quantidade || 0));
  const maiorHora = porHora.reduce((a, b) => (b.total > a.total ? b : a), { hora: null, total: 0 });
  const maiorDia = porDiaSemana.reduce((a, b) => (b.total > a.total ? b : a), { dia: null, total: 0 });

  // Dicas geradas a partir dos NÚMEROS da loja. As anteriores eram texto fixo,
  // iguais pra todo mundo e pra sempre — o parceiro aprendia a ignorar o card.
  const dicas = [];
  if ((analyticsData.pedidos_concluidos || 0) >= 3) {
    if (insights.taxa_cancelamento > 10) {
      dicas.push({ tom: 'red', icone: AlertTriangle,
        titulo: `${insights.taxa_cancelamento}% dos pedidos foram cancelados`,
        texto: 'Confira itens em falta no cardápio e o horário de funcionamento.' });
    }
    if (metricas.avaliacao_media != null && metricas.avaliacao_media < 4) {
      dicas.push({ tom: 'red', icone: Star,
        titulo: `Sua nota está em ${metricas.avaliacao_media}`,
        texto: 'Abaixo de 4,0 a loja aparece pior na busca do cliente.' });
    }
    if (metricas.tempo_medio_preparo != null && metricas.tempo_medio_preparo > 40) {
      dicas.push({ tom: 'amber', icone: Clock,
        titulo: `Preparo médio de ${metricas.tempo_medio_preparo} min`,
        texto: 'Acima de 40 min o cliente costuma não pedir de novo. Reveja o tempo do cardápio.' });
    }
    if (insights.taxa_recorrencia < 25 && (metricas.clientes_unicos || 0) >= 5) {
      dicas.push({ tom: 'blue', icone: Repeat,
        titulo: `Só ${insights.taxa_recorrencia}% dos clientes voltaram`,
        texto: 'Crie um cupom seu na aba Cupons pra trazer de volta quem pediu uma vez só.' });
    }
    if (maiorHora.hora != null && maiorHora.total > 0) {
      dicas.push({ tom: 'green', icone: Clock,
        titulo: `Seu pico é às ${maiorHora.hora}h`,
        texto: 'Reforce a cozinha nesse horário — é quando o atraso custa mais caro.' });
    }
    if (insights.ticket_medio > 0) {
      dicas.push({ tom: 'green', icone: TrendingUp,
        titulo: `Ticket médio de ${brl(insights.ticket_medio)}`,
        texto: 'Combo e bebida sugerida no pedido são o jeito mais barato de subir esse número.' });
    }
  }
  // Classes escritas por extenso: o Tailwind varre o código-fonte, então
  // string montada em runtime (`bg-${tom}-50`) não gera CSS.
  const TONS = {
    red:   { caixa: 'bg-red-50',   titulo: 'text-red-800',   texto: 'text-red-600' },
    amber: { caixa: 'bg-amber-50', titulo: 'text-amber-800', texto: 'text-amber-600' },
    blue:  { caixa: 'bg-blue-50',  titulo: 'text-blue-800',  texto: 'text-blue-600' },
    green: { caixa: 'bg-green-50', titulo: 'text-green-800', texto: 'text-green-600' },
  };

  // Função para formatar mudanças percentuais
  const formatChange = (value, suffix = '%') => {
    const isPositive = value > 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const icon = isPositive ? TrendingUp : TrendingDown;
    const Icon = icon;
    
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}{value.toFixed(1)}{suffix}
        </span>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header com controles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-800">Dashboard de Analytics</h1>
          <p className="text-gray-600 text-sm sm:text-base">Acompanhe o desempenho do seu restaurante</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={dateRange}
            onChange={(e) => {
              console.log('📅 Mudando período para:', e.target.value, 'dias');
              setDateRange(e.target.value);
            }}
            className="flex-1 sm:flex-none text-base border border-gray-300 rounded-lg px-3 py-2 bg-white min-h-[44px]"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
            <option value="all">Todo período</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 min-h-[44px]"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Cards de Resumo Principal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Vendas</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{formattedTotalSales}</p>
              {metricas.crescimento_mensal && formatChange(metricas.crescimento_mensal)}
            </div>
            <DollarSign className="h-12 w-12 text-orange-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Pedidos</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{analyticsData.pedidos_concluidos || 0}</p>
            </div>
            <ShoppingBag className="h-12 w-12 text-green-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Item Mais Vendido</p>
              <p className="text-xl font-bold text-purple-600 mt-1">{analyticsData.item_mais_vendido || 'N/A'}</p>
              <p className="text-sm text-gray-500">Produto em destaque</p>
            </div>
            <PieChart className="h-12 w-12 text-purple-300" />
          </div>
        </div>
      </div>

      {/* Cards de Métricas Secundárias */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avaliação Média</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-2xl font-bold text-yellow-600">{metricas.avaliacao_media ?? 'N/A'}</p>
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
              </div>
            </div>
            <Star className="h-8 w-8 text-yellow-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tempo Médio</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{metricas.tempo_medio_preparo != null ? `${metricas.tempo_medio_preparo} min` : 'N/A'}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Clientes Únicos</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{metricas.clientes_unicos || '0'}</p>
            </div>
            <Users className="h-8 w-8 text-indigo-300" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Taxa de Conversão</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{metricas.taxa_conversao || '0'}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-emerald-300" />
          </div>
        </div>
      </div>

      {/* Seção do Gráfico */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800 break-words">Vendas nos Últimos {dateRange === 'all' ? 'Todo período' : `${dateRange} Dias`}</h2>
          <Calendar className="h-6 w-6 text-gray-400" />
        </div>
        {analyticsData.vendas_por_dia && analyticsData.vendas_por_dia.length > 0 ? (
          <SalesChart data={analyticsData.vendas_por_dia} />
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Não há dados de vendas para exibir</p>
            <p className="text-gray-400 text-sm mt-2">Os dados aparecerão aqui quando você começar a receber pedidos</p>
          </div>
        )}
      </div>

      {/* Insights e Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Resumo de Performance</h3>
          <div className="divide-y divide-gray-100">
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600">Ticket médio</span>
              <span className="font-semibold text-gray-800">{brl(insights.ticket_medio)}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600">Pedidos cancelados</span>
              <span className="font-semibold text-red-600">
                {metricas.pedidos_cancelados || 0}
                <span className="text-sm font-normal text-gray-400 ml-1">
                  ({insights.taxa_cancelamento ?? 0}%)
                </span>
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <div>
                <span className="text-gray-600">Clientes que voltaram</span>
                <p className="text-xs text-gray-400">Pediram 2 ou mais vezes no período</p>
              </div>
              <span className="font-semibold text-indigo-600">
                {insights.clientes_recorrentes || 0}
                <span className="text-sm font-normal text-gray-400 ml-1">
                  ({insights.taxa_recorrencia ?? 0}%)
                </span>
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600">Melhor dia da semana</span>
              <span className="font-semibold text-gray-800">
                {maiorDia.total > 0 ? `${maiorDia.dia} · ${brl(maiorDia.total)}` : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-purple-500" />
            <h3 className="text-xl font-bold text-gray-800">Mais vendidos</h3>
          </div>
          {topItens.length > 0 ? (
            <div className="space-y-3">
              {topItens.map((item, i) => (
                <div key={`${item.nome}-${i}`}>
                  <div className="flex justify-between text-sm mb-1 gap-3">
                    <span className="text-gray-700 truncate">{i + 1}. {item.nome}</span>
                    <span className="font-semibold text-gray-600 flex-shrink-0">{item.quantidade}x</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-400 rounded-full"
                      style={{ width: `${(item.quantidade / maxItemQtd) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm py-6 text-center">
              Nenhum item vendido no período.
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-5 w-5 text-blue-500" />
            <h3 className="text-xl font-bold text-gray-800">Horários de pico</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            {maiorHora.total > 0
              ? `Você vende mais entre ${maiorHora.hora}h e ${maiorHora.hora + 1}h`
              : 'Sem vendas no período'}
          </p>
          <div className="flex items-end gap-[2px] h-28">
            {porHora.map((h) => (
              <div
                key={h.hora}
                title={`${h.hora}h — ${brl(h.total)}`}
                className="flex-1 bg-gray-100 rounded-t flex items-end"
                style={{ height: '100%' }}
              >
                <div
                  className={`w-full rounded-t ${h.hora === maiorHora.hora && h.total > 0 ? 'bg-orange-500' : 'bg-blue-300'}`}
                  style={{ height: `${maiorHora.total > 0 ? (h.total / maiorHora.total) * 100 : 0}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h3 className="text-xl font-bold text-gray-800">Dicas de Melhoria</h3>
          </div>
          {dicas.length > 0 ? (
            <div className="space-y-3">
              {dicas.slice(0, 4).map((d, i) => {
                const t = TONS[d.tom];
                const Icone = d.icone;
                return (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${t.caixa}`}>
                    <Icone className={`h-5 w-5 mt-0.5 flex-shrink-0 ${t.texto}`} />
                    <div>
                      <p className={`font-medium ${t.titulo}`}>{d.titulo}</p>
                      <p className={`text-sm ${t.texto}`}>{d.texto}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Lightbulb className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <p className="text-gray-500">Ainda não há pedidos suficientes</p>
              <p className="text-sm text-gray-400 mt-1">
                As dicas aparecem a partir de 3 pedidos entregues no período.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
