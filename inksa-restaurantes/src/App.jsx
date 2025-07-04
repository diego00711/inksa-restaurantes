import React, { useState, useEffect } from 'react';

// --- ATENÇÃO ---
// Certifique-se de que os imports abaixo correspondem à estrutura do seu projeto.
// Se você usa 'shadcn/ui', eles devem funcionar. Caso contrário, ajuste conforme necessário.
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { 
  Store, ShoppingCart, DollarSign, TrendingUp, Clock, 
  CheckCircle, XCircle, AlertCircle, Users, Star,
  Package, Truck, Bell, Settings, LogOut, Eye,
  Edit, Trash2, Plus, Search, Filter, Download,
  MapPin, Phone, Mail, Calendar, BarChart3
} from 'lucide-react';

// --- CORREÇÃO ---
// A importação do App.css foi removida para corrigir o erro de compilação.
// O import da logo também foi removido para evitar erros de compilação.
// import logoImg from './assets/logo.png'; 
// import './App.css';

// Dados simulados (mantidos como no seu arquivo original)
const mockOrders = [
  { id: '#001', customer: 'João Silva', items: ['2x Hambúrguer', '1x Batata Frita', '1x Refrigerante'], total: 45.90, status: 'pending', time: '14:30', address: 'Rua das Flores, 123', phone: '(11) 99999-9999' },
  { id: '#002', customer: 'Maria Santos', items: ['1x Pizza Margherita', '1x Coca-Cola'], total: 32.50, status: 'preparing', time: '14:25', address: 'Av. Principal, 456', phone: '(11) 88888-8888' },
  { id: '#003', customer: 'Pedro Costa', items: ['1x Salada Caesar', '1x Suco Natural'], total: 28.00, status: 'ready', time: '14:20', address: 'Rua do Comércio, 789', phone: '(11) 77777-7777' },
  { id: '#004', customer: 'Ana Oliveira', items: ['3x Pastel', '1x Caldo de Cana'], total: 18.50, status: 'delivered', time: '14:15', address: 'Praça Central, 321', phone: '(11) 66666-6666' }
];
const mockStats = { todayOrders: 24, todayRevenue: 1250.80, avgOrderValue: 52.12, completionRate: 95 };
const chartData = [
  { name: 'Seg', pedidos: 12, receita: 580 }, { name: 'Ter', pedidos: 19, receita: 890 }, { name: 'Qua', pedidos: 15, receita: 720 }, { name: 'Qui', pedidos: 22, receita: 1100 }, { name: 'Sex', pedidos: 28, receita: 1350 }, { name: 'Sáb', pedidos: 35, receita: 1680 }, { name: 'Dom', pedidos: 18, receita: 850 }
];


// --- COMPONENTE DE LOGIN ATUALIZADO ---
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simular autenticação
    setTimeout(() => {
      if (email === 'restaurante@inksa.com' && password === 'rest123') {
        localStorage.setItem('restaurantLoggedIn', 'true');
        onLogin(true);
      } else {
        // Em um app real, você usaria um toast ou uma mensagem de erro mais elegante.
        alert('Credenciais inválidas');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-500 via-red-500 to-orange-400 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 md:p-12 transform transition-all hover:scale-[1.01]">
        
        <div className="text-center mb-8">
          <img 
            src="https://placehold.co/128x128/F97316/FFFFFF.png?text=Inksa&font=montserrat"
            alt="Logo da Inksa Restaurantes"
            className="w-24 h-24 mx-auto mb-4 rounded-full shadow-md object-contain p-2"
            onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/128x128/cccccc/ffffff?text=Logo'; }}
          />
          <h1 className="text-3xl font-bold text-gray-800">
            Inksa Restaurantes
          </h1>
          <p className="text-gray-500 mt-2">
            Painel de Controle
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="space-y-6">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email do Restaurante
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition"
                placeholder="seuemail@restaurante.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </Label>
              <Input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg mt-8 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-transform transform hover:scale-105 h-11 text-base"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Acessar Painel'}
          </Button>
        </form>

        <div className="mt-8 p-4 border border-gray-200 rounded-lg bg-gray-50 text-center">
          <h3 className="text-sm font-semibold text-gray-600">Credenciais de teste:</h3>
          <p className="text-sm text-gray-500 mt-2">
            Email: restaurante@inksa.com
          </p>
          <p className="text-sm text-gray-500">
            Senha: rest123
          </p>
        </div>
        
      </div>
    </div>
  );
}


// --- DEMAIS COMPONENTES (MANTIDOS COMO ESTAVAM) ---

// Componente de Header
function Header({ restaurantName, onLogout }) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img 
            src="https://placehold.co/64x64/F97316/FFFFFF.png?text=I&font=montserrat"
            alt="Inksa Logo" 
            className="w-10 h-10 rounded-lg object-contain"
            onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/64x64/cccccc/ffffff?text=I'; }}
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{restaurantName}</h1>
            <p className="text-gray-600">Painel de Controle de Pedidos</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 mr-2" />
            Notificações
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button variant="outline" size="sm" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  )
}

// Componente de Estatísticas
function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pedidos Hoje</p>
              <p className="text-3xl font-bold text-gray-900">{mockStats.todayOrders}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Hoje</p>
              <p className="text-3xl font-bold text-gray-900">R$ {mockStats.todayRevenue.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
              <p className="text-3xl font-bold text-gray-900">R$ {mockStats.avgOrderValue.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
              <p className="text-3xl font-bold text-green-600">{mockStats.completionRate}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente de Pedido
function OrderCard({ order, onUpdateStatus }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'preparing': return 'bg-blue-100 text-blue-800'
      case 'ready': return 'bg-green-100 text-green-800'
      case 'delivered': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pendente'
      case 'preparing': return 'Preparando'
      case 'ready': return 'Pronto'
      case 'delivered': return 'Entregue'
      default: return 'Desconhecido'
    }
  }

  const getNextStatus = (status) => {
    switch (status) {
      case 'pending': return 'preparing'
      case 'preparing': return 'ready'
      case 'ready': return 'delivered'
      default: return status
    }
  }

  const getNextStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Iniciar Preparo'
      case 'preparing': return 'Marcar como Pronto'
      case 'ready': return 'Marcar como Entregue'
      default: return ''
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{order.id}</h3>
            <p className="text-gray-600">{order.customer}</p>
            <p className="text-sm text-gray-500">{order.time}</p>
          </div>
          <Badge className={getStatusColor(order.status)}>
            {getStatusText(order.status)}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <h4 className="font-medium text-gray-900">Itens:</h4>
          <ul className="text-sm text-gray-600">
            {order.items.map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        </div>

        <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{order.address}</span>
        </div>

        <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600">
          <Phone className="w-4 h-4" />
          <span>{order.phone}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">
            R$ {order.total.toFixed(2)}
          </span>
          {order.status !== 'delivered' && (
            <Button 
              size="sm" 
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => onUpdateStatus(order.id, getNextStatus(order.status))}
            >
              {getNextStatusText(order.status)}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Componente de Gráficos
function ChartsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Pedidos por Dia</CardTitle>
          <CardDescription>Últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="pedidos" fill="#ea580c" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Receita por Dia</CardTitle>
          <CardDescription>Últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`R$ ${value}`, 'Receita']} />
              <Line type="monotone" dataKey="receita" stroke="#ea580c" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente Principal do Dashboard
function RestaurantDashboard({ onLogout }) {
  const [orders, setOrders] = useState(mockOrders)
  const [activeTab, setActiveTab] = useState('dashboard')

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ))
  }

  const filterOrdersByStatus = (status) => {
    return orders.filter(order => order.status === status)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header restaurantName="Restaurante Exemplo" onLogout={onLogout} />
      
      <main className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="analytics">Relatórios</TabsTrigger>
            <TabsTrigger value="menu">Cardápio</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <StatsCards />
            <ChartsSection />
            
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Recentes</CardTitle>
                <CardDescription>Últimos pedidos recebidos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orders.slice(0, 3).map(order => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      onUpdateStatus={handleUpdateOrderStatus}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Gerenciar Pedidos</h2>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">Todos ({orders.length})</TabsTrigger>
                <TabsTrigger value="pending">Pendentes ({filterOrdersByStatus('pending').length})</TabsTrigger>
                <TabsTrigger value="preparing">Preparando ({filterOrdersByStatus('preparing').length})</TabsTrigger>
                <TabsTrigger value="ready">Prontos ({filterOrdersByStatus('ready').length})</TabsTrigger>
                <TabsTrigger value="delivered">Entregues ({filterOrdersByStatus('delivered').length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orders.map(order => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      onUpdateStatus={handleUpdateOrderStatus}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="pending">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterOrdersByStatus('pending').map(order => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      onUpdateStatus={handleUpdateOrderStatus}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="preparing">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterOrdersByStatus('preparing').map(order => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      onUpdateStatus={handleUpdateOrderStatus}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="ready">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterOrdersByStatus('ready').map(order => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      onUpdateStatus={handleUpdateOrderStatus}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="delivered">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterOrdersByStatus('delivered').map(order => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      onUpdateStatus={handleUpdateOrderStatus}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Relatórios e Analytics</h2>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar Relatório
              </Button>
            </div>
            
            <StatsCards />
            <ChartsSection />
            
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Período</CardTitle>
                <CardDescription>Últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">156</p>
                    <p className="text-gray-600">Total de Pedidos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">R$ 8.240,50</p>
                    <p className="text-gray-600">Receita Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">4.8</p>
                    <p className="text-gray-600">Avaliação Média</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="menu" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Gerenciar Cardápio</h2>
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-12">
                <div className="text-center text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Gerenciamento de Cardápio</h3>
                  <p>Esta funcionalidade será implementada em breve.</p>
                  <p className="text-sm mt-2">Aqui você poderá adicionar, editar e remover itens do seu cardápio.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Componente Principal da Aplicação
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Verificar se o restaurante está logado
    const loggedIn = localStorage.getItem('restaurantLoggedIn') === 'true'
    setIsLoggedIn(loggedIn)
  }, [])

  const handleLogin = (status) => {
    setIsLoggedIn(status)
  }

  const handleLogout = () => {
    localStorage.removeItem('restaurantLoggedIn')
    setIsLoggedIn(false)
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />
  }

  return <RestaurantDashboard onLogout={handleLogout} />
}

export default App;
