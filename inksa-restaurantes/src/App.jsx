import React, { useState, useEffect } from 'react';

// Imports de bibliotecas de terceiros
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { 
  ShoppingCart, DollarSign, TrendingUp, CheckCircle,
  Package, Bell, Settings, LogOut, Filter, Download,
  MapPin, Phone, Plus
} from 'lucide-react';

// A importação do CSS principal deve estar no seu arquivo 'src/main.jsx'.

// --- Dados Simulados ---
const mockOrders = [
  { id: '#001', customer: 'João Silva', items: ['2x Hambúrguer', '1x Batata Frita'], total: 45.90, status: 'pending', time: '14:30', address: 'Rua das Flores, 123', phone: '(11) 99999-9999' },
  { id: '#002', customer: 'Maria Santos', items: ['1x Pizza Margherita'], total: 32.50, status: 'preparing', time: '14:25', address: 'Av. Principal, 456', phone: '(11) 88888-8888' },
  { id: '#003', customer: 'Pedro Costa', items: ['1x Salada Caesar'], total: 28.00, status: 'ready', time: '14:20', address: 'Rua do Comércio, 789', phone: '(11) 77777-7777' },
  { id: '#004', customer: 'Ana Oliveira', items: ['3x Pastel'], total: 18.50, status: 'delivered', time: '14:15', address: 'Praça Central, 321', phone: '(11) 66666-6666' }
];
const mockStats = { todayOrders: 24, todayRevenue: 1250.80, avgOrderValue: 52.12, completionRate: 95 };
const chartData = [
  { name: 'Seg', pedidos: 12, receita: 580 }, { name: 'Ter', pedidos: 19, receita: 890 }, { name: 'Qua', pedidos: 15, receita: 720 }, { name: 'Qui', pedidos: 22, receita: 1100 }, { name: 'Sex', pedidos: 28, receita: 1350 }, { name: 'Sáb', pedidos: 35, receita: 1680 }, { name: 'Dom', pedidos: 18, receita: 850 }
];

// --- Componentes ---

const InksaLogo = ({ className }) => (
  <div className={`mx-auto flex items-center justify-center rounded-full bg-orange-500 shadow-md ${className}`}>
    <span className="font-bold text-white tracking-tighter" style={{ fontSize: `calc(0.4 * ${className.includes('w-24') ? '6rem' : '2.5rem'})` }}>
      IR
    </span>
  </div>
);

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (email === 'restaurante@inksa.com' && password === 'rest123') {
        localStorage.setItem('restaurantLoggedIn', 'true');
        onLogin(true);
      } else {
        alert('Credenciais inválidas');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-500 via-red-500 to-orange-400 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-8">
          <InksaLogo className="w-24 h-24 mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">Inksa Restaurantes</h1>
          <p className="text-gray-500 mt-2">Painel de Controle</p>
        </div>
        <form onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email do Restaurante</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seuemail@restaurante.com" required className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <button type="submit" className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-md" disabled={loading}>
            {loading ? 'Entrando...' : 'Acessar Painel'}
          </button>
        </form>
        <div className="mt-6 p-4 border rounded-lg bg-gray-50 text-center">
          <h3 className="text-sm font-semibold text-gray-600">Credenciais de teste:</h3>
          <p className="text-sm text-gray-500 mt-2">Email: restaurante@inksa.com</p>
          <p className="text-sm text-gray-500">Senha: rest123</p>
        </div>
      </div>
    </div>
  );
}

function Header({ restaurantName, onLogout }) {
  return (
    <header className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <InksaLogo className="w-10 h-10" />
          <div>
            <h1 className="text-2xl font-bold">{restaurantName}</h1>
            <p className="text-gray-500">Painel de Controle de Pedidos</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border px-3 py-1.5"><Bell className="w-4 h-4 mr-2" />Notificações</button>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border px-3 py-1.5"><Settings className="w-4 h-4 mr-2" />Configurações</button>
          <button onClick={onLogout} className="inline-flex items-center justify-center rounded-md text-sm font-medium border px-3 py-1.5"><LogOut className="w-4 h-4 mr-2" />Sair</button>
        </div>
      </div>
    </header>
  );
}

function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg border shadow-sm"><div className="p-6 flex justify-between items-center"><div><p>Pedidos Hoje</p><p className="text-3xl font-bold">{mockStats.todayOrders}</p></div><div className="p-3 bg-blue-100 rounded-full"><ShoppingCart className="w-6 h-6 text-blue-600" /></div></div></div>
      <div className="bg-white rounded-lg border shadow-sm"><div className="p-6 flex justify-between items-center"><div><p>Receita Hoje</p><p className="text-3xl font-bold">R$ {mockStats.todayRevenue.toFixed(2)}</p></div><div className="p-3 bg-green-100 rounded-full"><DollarSign className="w-6 h-6 text-green-600" /></div></div></div>
      <div className="bg-white rounded-lg border shadow-sm"><div className="p-6 flex justify-between items-center"><div><p>Ticket Médio</p><p className="text-3xl font-bold">R$ {mockStats.avgOrderValue.toFixed(2)}</p></div><div className="p-3 bg-purple-100 rounded-full"><TrendingUp className="w-6 h-6 text-purple-600" /></div></div></div>
      <div className="bg-white rounded-lg border shadow-sm"><div className="p-6 flex justify-between items-center"><div><p>Taxa de Conclusão</p><p className="text-3xl font-bold text-green-600">{mockStats.completionRate}%</p></div><div className="p-3 bg-green-100 rounded-full"><CheckCircle className="w-6 h-6 text-green-600" /></div></div></div>
    </div>
  );
}

function OrderCard({ order, onUpdateStatus }) {
  const getStatusColor = (status) => ({ pending: 'bg-yellow-100 text-yellow-800', preparing: 'bg-blue-100 text-blue-800', ready: 'bg-green-100 text-green-800', delivered: 'bg-gray-100 text-gray-800' }[status] || 'bg-gray-100');
  const getStatusText = (status) => ({ pending: 'Pendente', preparing: 'Preparando', ready: 'Pronto', delivered: 'Entregue' }[status] || 'Desconhecido');
  const getNextStatus = (status) => ({ pending: 'preparing', preparing: 'ready', ready: 'delivered' }[status] || status);
  const getNextStatusText = (status) => ({ pending: 'Iniciar Preparo', preparing: 'Marcar como Pronto', ready: 'Marcar como Entregue' }[status] || '');

  return (
    <div className="bg-white rounded-lg border shadow-sm"><div className="p-6">
      <div className="flex justify-between items-start mb-4"><div><h3 className="font-semibold">{order.id}</h3><p>{order.customer}</p><p className="text-sm text-gray-500">{order.time}</p></div><span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(order.status)}`}>{getStatusText(order.status)}</span></div>
      <div className="mb-4"><h4>Itens:</h4><ul>{order.items.map((item, i) => <li key={i}>• {item}</li>)}</ul></div>
      <div className="flex items-center space-x-2 mb-4"><MapPin className="w-4 h-4" /><span>{order.address}</span></div>
      <div className="flex items-center space-x-2 mb-4"><Phone className="w-4 h-4" /><span>{order.phone}</span></div>
      <div className="flex justify-between items-center"><span className="text-xl font-bold">R$ {order.total.toFixed(2)}</span>{order.status !== 'delivered' && <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-1 px-2 rounded-md text-sm" onClick={() => onUpdateStatus(order.id, getNextStatus(order.status))}>{getNextStatusText(order.status)}</button>}</div>
    </div></div>
  );
}

function ChartsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg border shadow-sm"><div className="p-6"><h3 className="text-2xl font-semibold">Pedidos por Dia</h3><p className="text-sm text-gray-500">Últimos 7 dias</p></div><div className="p-6 pt-0"><ResponsiveContainer width="100%" height={300}><BarChart data={chartData}><CartesianGrid /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="pedidos" fill="#ea580c" /></BarChart></ResponsiveContainer></div></div>
      <div className="bg-white rounded-lg border shadow-sm"><div className="p-6"><h3 className="text-2xl font-semibold">Receita por Dia</h3><p className="text-sm text-gray-500">Últimos 7 dias</p></div><div className="p-6 pt-0"><ResponsiveContainer width="100%" height={300}><LineChart data={chartData}><CartesianGrid /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v) => [`R$ ${v}`, 'Receita']}/><Line type="monotone" dataKey="receita" stroke="#ea580c" /></LineChart></ResponsiveContainer></div></div>
    </div>
  );
}

function RestaurantDashboard({ onLogout }) {
  const [orders, setOrders] = useState(mockOrders);
  const [activeTab, setActiveTab] = useState('dashboard');
  const handleUpdateOrderStatus = (orderId, newStatus) => setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  const filterOrdersByStatus = (status) => orders.filter(o => o.status === status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header restaurantName="Restaurante Exemplo" onLogout={onLogout} />
      <main className="p-6">
        <div>
          <div className="inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 grid w-full grid-cols-4">
            <button onClick={() => setActiveTab('dashboard')} className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ${activeTab === 'dashboard' ? 'bg-white text-gray-900 shadow-sm' : ''}`}>Dashboard</button>
            <button onClick={() => setActiveTab('orders')} className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ${activeTab === 'orders' ? 'bg-white text-gray-900 shadow-sm' : ''}`}>Pedidos</button>
            <button onClick={() => setActiveTab('analytics')} className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ${activeTab === 'analytics' ? 'bg-white text-gray-900 shadow-sm' : ''}`}>Relatórios</button>
            <button onClick={() => setActiveTab('menu')} className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ${activeTab === 'menu' ? 'bg-white text-gray-900 shadow-sm' : ''}`}>Cardápio</button>
          </div>
          
          {activeTab === 'dashboard' && <div className="space-y-6 mt-4"><StatsCards /><ChartsSection /><div className="bg-white rounded-lg border shadow-sm"><div className="p-6"><h3 className="text-2xl font-semibold">Pedidos Recentes</h3></div><div className="p-6 pt-0"><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{orders.slice(0, 3).map(o => <OrderCard key={o.id} order={o} onUpdateStatus={handleUpdateOrderStatus} />)}</div></div></div></div>}
          
          {activeTab === 'orders' && <div className="space-y-6 mt-4"><div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Gerenciar Pedidos</h2><div className="flex space-x-2"><button className="inline-flex items-center justify-center rounded-md text-sm font-medium border px-3 py-1.5"><Filter className="w-4 h-4 mr-2" />Filtros</button><button className="inline-flex items-center justify-center rounded-md text-sm font-medium border px-3 py-1.5"><Download className="w-4 h-4 mr-2" />Exportar</button></div></div><div><div className="inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500"><button>Todos ({orders.length})</button><button>Pendentes ({filterOrdersByStatus('pending').length})</button></div></div></div>}
          
          {activeTab === 'analytics' && <div className="space-y-6 mt-4"><h2 className="text-2xl font-bold">Relatórios e Analytics</h2><StatsCards /><ChartsSection /></div>}
          
          {activeTab === 'menu' && <div className="space-y-6 mt-4"><div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Gerenciar Cardápio</h2><button className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-orange-500 text-white px-3 py-1.5"><Plus className="w-4 h-4 mr-2" />Adicionar Item</button></div><div className="bg-white rounded-lg border shadow-sm"><div className="p-12 text-center text-gray-500"><Package className="w-16 h-16 mx-auto mb-4" /><h3 className="text-lg font-medium">Gerenciamento de Cardápio</h3><p>Funcionalidade em breve.</p></div></div></div>}
        </div>
      </main>
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => { setIsLoggedIn(localStorage.getItem('restaurantLoggedIn') === 'true'); }, []);
  const handleLogin = (status) => setIsLoggedIn(status);
  const handleLogout = () => { localStorage.removeItem('restaurantLoggedIn'); setIsLoggedIn(false); };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }
  return <RestaurantDashboard onLogout={handleLogout} />;
}

export default App;
