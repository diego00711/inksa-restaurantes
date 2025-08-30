import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; 

// --- Páginas ---
import { LoginPage } from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage'; 
import { RegisterPage } from './pages/RegisterPage';
import { OrdersPage } from './pages/OrdersPage';
import { MenuPage } from './pages/MenuPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CategoryManagementPage } from './pages/CategoryManagementPage';
import RestaurantGamificationPage from './pages/RestaurantGamificationPage';
// <<< NOVO: Importar Central de Avaliações >>>
import RestaurantEvaluationsCenter from './pages/RestaurantEvaluationsCenter';

// --- Componentes e Contextos ---
import { PortalLayout } from './components/restaurant-portal/PortalLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastProvider } from './context/ToastContext.jsx'; 
import { ProfileProvider } from './context/ProfileContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ProfileProvider>
          <Routes>
            {/* Rotas PÚBLICAS */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Rota PAI para o Portal (Protegida) */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <PortalLayout />
                </ProtectedRoute>
              }
            >
              {/* Rotas FILHAS do portal */}
              <Route index element={<Navigate to="/pedidos" replace />} />
              <Route path="pedidos" element={<OrdersPage />} />
              <Route path="cardapio" element={<MenuPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="configuracoes" element={<SettingsPage />} />
              <Route path="categorias" element={<CategoryManagementPage />} />
              <Route path="gamificacao" element={<RestaurantGamificationPage />} />
              {/* <<< CENTRAL DE AVALIAÇÕES >>> */}
              <Route path="avaliacoes" element={<RestaurantEvaluationsCenter />} />
            </Route>

            {/* Redirecionamento legado */}
            <Route path="/dashboard" element={<Navigate to="/pedidos" replace />} />
          </Routes>
        </ProfileProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
