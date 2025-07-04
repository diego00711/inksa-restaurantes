import React, { useState, useEffect } from 'react';

// Imports dos componentes UI do shadcn/ui.
// Certifique-se de que a sua pasta 'components/ui' existe em 'src/'.
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
            <Button type="submit" className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white" disabled={loading}>
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
  const getStatusText = (status) => ({ pending: 'Pende
