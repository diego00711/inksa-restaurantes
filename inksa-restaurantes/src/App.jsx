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

// --- Componentes UI Simples ---
const Card = ({ children, className }) => <div className={`bg-white rounded-lg border shadow-sm ${className}`}>{children}</div>;
const CardHeader = ({ children, className }) => <div className={`p-6 ${className}`}>{children}</div>;
const CardTitle = ({ children, className }) => <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
const CardDescription = ({ children, className }) => <p className={`text-sm text-gray-500 ${className}`}>{children}</p>;
const CardContent = ({ children, className }) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;
const Button = ({ children, className, variant, size, ...props }) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    const sizeClasses = size === 'sm' ? 'h-9 px-3' : 'h-10 px-4 py-2';
    const variantClasses = variant === 'outline' ? 'border border-input bg-background hover:bg-accent hover:text-accent-foreground' : 'bg-orange-500 text-white hover:bg-orange-600';
    return <button className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`} {...props}>{children}</button>;
};
const Input = ({ className, ...props }) => <input className={`flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ${className}`} {...props} />;
const Label = ({ children, className, ...props }) => <label className={`text-sm font-medium leading-none ${className}`} {...props}>{children}</label>;
const Badge = ({ children, className }) => <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${className}`}>{children}</span>;
const Tabs = ({ children, className, ...props }) => <div className={className} {...props}>{children}</div>;
const TabsList = ({ children, className, ...props }) => <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 ${className}`} {...props}>{children}</div>;
const TabsTrigger = ({ children, className, 'data-state': dataState, ...props }) => <button className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm ${className}`} data-state={dataState} {...props}>{children}</button>;
const TabsContent = ({ children, className, value: tabValue, ...props }) => <div className={className} {...props}>{children}</div>;


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
      <Card className="w-full max-w-md p-8 md:p-12">
        <CardHeader className="text-center mb-4 p-0">
          <InksaLogo className="w-24 h-24 mb-4" />
          <CardTitle>Inksa Restaurantes</CardTitle>
          <CardDescription>Painel de Controle</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email do Restaurante</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seuemail@restaurante.com" required />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
            </div>
            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? 'Entrando...' : 'Acessar Painel'}
            </Button>
          </form>
          <div className="mt-6 p-4 border rounded-lg bg-gray-50 text-center">
            <h3 className="text-sm font-semibold text-gray-600">Credenciais de teste:</h3>
            <p className="text-sm text-gray-500 mt-2">Email: restaurante@inksa.com</p>
            <p className="text-sm text-gray-500">Senha: rest123</p>
          </div>
        </CardContent>
      </Card>
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
          <Button variant="outline" size="sm"><Bell className="w-4 h-4 mr-2" />Notificações</Button>
          <Button variant="outline" size="sm"><Settings className="w-4 h-4 mr-2" />Configurações</Button>
          <Button variant="outline" size="sm" onClick={onLogout}><LogOut className="w-4 h-4 mr-2" />Sair</Button>
        </div>
      </div>
    </header>
  );
}

function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card><CardContent className="p-6 flex justify-between items-center"><div><p>Pedidos Hoje</p><p className="text-3xl font-bold">{mockStats.todayOrders}</p></div><div className="p-3 bg-blue-100 rounded-full"><ShoppingCart className="w-6 h-6 text-blue-600" /></div></CardContent></Card>
      <Card><CardContent className="p-6 flex justify-between items-center"><div><p>Receita Hoje</p><p className="text-3xl font-bold">R$ {mockStats.todayRevenue.toFixed(2)}</p></div><div className="p-3 bg-green-100 rounded-full"><DollarSign className="w-6 h-6 text-green-600" /></div></CardContent></Card>
      <Card><CardContent className="p-6 flex justify-between items-center"><div><p>Ticket Médio</p><p className="text-3xl font-bold">R$ {mockStats.avgOrderValue.toFixed(2)}</p></div><div className="p-3 bg-purple-100 rounded-full"><TrendingUp className="w-6 h-6 text-purple-600" /></div></CardContent></Card>
      <Card><CardContent className="p-6 flex justify-between items-center"><div><p>Taxa de Conclusão</p><p className="text-3xl font-bold text-green-600">{mockStats.completionRate}%</p></div><div className="p-3 bg-green-100 rounded-full"><CheckCircle className="w-6 h-6 text-green-600" /></div></CardContent></Card>
    </div>
  );
}

function OrderCard({ order, onUpdateStatus }) {
  const getStatusColor = (status) => ({ pending: 'bg-yellow-100 text-yellow-800', preparing: 'bg-blue-100 text-blue-800', ready: 'bg-green-100 text-green-800', delivered: 'bg-gray-100 text-gray-800' }[status] || 'bg-gray-100');
  const getStatusText = (status) => ({ pending: 'Pendente', preparing: 'Preparando', ready: 'Pronto', delivered: 'Entregue' }[status] || 'Desconhecido');
  const getNextStatus = (status) => ({ pending: 'preparing', preparing: 'ready', ready: 'delivered' }[status] || status);
  const getNextStatusText = (status) => ({ pending: 'Iniciar Preparo', preparing: 'Marcar como Pronto', ready: 'Marcar como Entregue' }[status] || '');

  return (
    <Card><CardContent className="p-6">
      <div className="flex justify-between items-start mb-4"><div><h3 className="font-semibold">{order.id}</h3><p>{order.customer}</p><p className="text-sm text-gray-500">{order.time}</p></div><Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge></div>
      <div className="mb-4"><h4>Itens:</h4><ul>{order.items.map((item, i) => <li key={i}>• {item}</li>)}</ul></div>
      <div className="flex items-center space-x-2 mb-4"><MapPin className="w-4 h-4" /><span>{order.address}</span></div>
      <div className="flex items-center space-x-2 mb-4"><Phone className="w-4 h-4" /><span>{order.phone}</span></div>
      <div className="flex justify-between items-center"><span className="text-xl font-bold">R$ {order.total.toFixed(2)}</span>{order.status !== 'delivered' && <Button size="sm" onClick={() => onUpdateStatus(order.id, getNextStatus(order.status))}>{getNextStatusText(order.status)}</Button>}</div>
    </CardContent></Card>
  );
}

function ChartsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card><CardHeader><CardTitle>Pedidos por Dia</CardTitle><CardDescription>Últimos 7 dias</CardDescription></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={chartData}><CartesianGrid /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="pedidos" fill="#ea580c" /></BarChart></ResponsiveContainer></CardContent></Card>
      <Card><CardHeader><CardTitle>Receita por Dia</CardTitle><CardDescription>Últimos 7 dias</CardDescription></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><LineChart data={chartData}><CartesianGrid /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(v) => [`R$ ${v}`, 'Receita']}/><Line type="monotone" dataKey="receita" stroke="#ea580c" /></LineChart></ResponsiveContainer></CardContent></Card>
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" data-state={activeTab === 'dashboard' ? 'active' : ''}>Dashboard</TabsTrigger>
            <TabsTrigger value="orders" data-state={activeTab === 'orders' ? 'active' : ''}>Pedidos</TabsTrigger>
            <TabsTrigger value="analytics" data-state={activeTab === 'analytics' ? 'active' : ''}>Relatórios</TabsTrigger>
            <TabsTrigger value="menu" data-state={activeTab === 'menu' ? 'active' : ''}>Cardápio</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6 mt-4">
            <StatsCards />
            <ChartsSection />
            <Card>
              <CardHeader><CardTitle>Pedidos Recentes</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orders.slice(0, 3).map(o => <OrderCard key={o.id} order={o} onUpdateStatus={handleUpdateOrderStatus} />)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="orders" className="space-y-6 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gerenciar Pedidos</h2>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" />Filtros</Button>
                <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Exportar</Button>
              </div>
            </div>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">Todos ({orders.length})</TabsTrigger>
                <TabsTrigger value="pending">Pendentes ({filterOrdersByStatus('pending').length})</TabsTrigger>
                <TabsTrigger value="preparing">Preparando ({filterOrdersByStatus('preparing').length})</TabsTrigger>
                <TabsTrigger value="ready">Prontos ({filterOrdersByStatus('ready').length})</TabsTrigger>
              </TabsList>
              {['all', 'pending', 'preparing', 'ready', 'delivered'].map(status => (
                <TabsContent key={status} value={status}>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(status === 'all' ? orders : filterOrdersByStatus(status)).map(o => 
                      <OrderCard key={o.id} order={o} onUpdateStatus={handleUpdateOrderStatus} />
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6 mt-4">
            <h2 className="text-2xl font-bold">Relatórios e Analytics</h2>
            <StatsCards />
            <ChartsSection />
          </TabsContent>
          
          <TabsContent value="menu" className="space-y-6 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gerenciar Cardápio</h2>
              <Button><Plus className="w-4 h-4 mr-2" />Adicionar Item</Button>
            </div>
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <Package className="w-16 h-16 mx-auto mb-4" />
                <h3>Gerenciamento de Cardápio</h3>
                <p>Funcionalidade em breve.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
