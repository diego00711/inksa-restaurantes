import React, { useState, useEffect } from 'react'
// 1. IMPORTAR AS FERRAMENTAS DE ROTA
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom' 

import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
// ... (todos os outros imports que você já tem continuam aqui)
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts'
import { 
  Store, ShoppingCart, DollarSign, TrendingUp, Clock, 
  CheckCircle, XCircle, AlertCircle, Users, Star,
  Package, Truck, Bell, Settings, LogOut, Eye,
  Edit, Trash2, Plus, Search, Filter, Download,
  MapPin, Phone, Mail, Calendar, BarChart3
} from 'lucide-react'
import logoImg from './assets/logo.png'
import './App.css'


// --- SEUS COMPONENTES (COPIE E COLE TODOS ELES AQUI, SEM MUDANÇAS) ---
// Dados simulados
const mockOrders = [ /* ... seu código ... */ ]
const mockStats = { /* ... seu código ... */ }
const chartData = [ /* ... seu código ... */ ]


// Componente de Login - MODIFICADO
function LoginPage() { // Não precisa mais de 'onLogin'
  const navigate = useNavigate(); // Hook para navegar entre páginas
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      if (email === 'restaurante@inksa.com' && password === 'rest123') {
        localStorage.setItem('restaurantLoggedIn', 'true');
        navigate('/dashboard'); // 2. NAVEGAR PARA O PAINEL APÓS O LOGIN
      } else {
        alert('Credenciais inválidas');
      }
      setLoading(false);
    }, 1000);
  }

  // O return do LoginPage continua exatamente o mesmo
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 flex items-center justify-center p-4">
      {/* ... todo o seu JSX do LoginPage ... */}
    </div>
  )
}

// Componente de Header
function Header({ restaurantName, onLogout }) { /* ... seu código sem mudanças ... */ }

// Componente de Estatísticas
function StatsCards() { /* ... seu código sem mudanças ... */ }

// Componente de Pedido
function OrderCard({ order, onUpdateStatus }) { /* ... seu código sem mudanças ... */ }

// Componente de Gráficos
function ChartsSection() { /* ... seu código sem mudanças ... */ }

// Componente Principal - MODIFICADO
function RestaurantDashboard() { // Não precisa mais de 'onLogout'
  const navigate = useNavigate(); // Hook para navegar
  const [orders, setOrders] = useState(mockOrders)
  const [activeTab, setActiveTab] = useState('dashboard')

  // 3. ADICIONAR PROTEÇÃO: se não estiver logado, volta para a tela de login
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('restaurantLoggedIn') === 'true';
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('restaurantLoggedIn');
    navigate('/login'); // Navega para o login ao sair
  }

  const handleUpdateOrderStatus = (orderId, newStatus) => { /* ... seu código sem mudanças ... */ }
  const filterOrdersByStatus = (status) => { /* ... seu código sem mudanças ... */ }

  // O return do RestaurantDashboard é quase o mesmo, só muda a chamada do Header
  return (
    <div className="min-h-screen bg-gray-50">
      <Header restaurantName="Restaurante Exemplo" onLogout={handleLogout} />
      <main className="p-6">
        {/* ... todo o seu JSX do RestaurantDashboard ... */}
      </main>
    </div>
  )
}

// --- COMPONENTE APP TOTALMENTE REFEITO COM ROTAS ---
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<RestaurantDashboard />} />
      
      {/* 4. Rota principal: redireciona para o login ou dashboard */}
      <Route 
        path="/" 
        element={
          localStorage.getItem('restaurantLoggedIn') === 'true' 
            ? <Navigate to="/dashboard" /> 
            : <Navigate to="/login" />
        } 
      />
    </Routes>
  );
}

export default App;