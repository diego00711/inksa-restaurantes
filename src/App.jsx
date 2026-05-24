import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

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
import { ToastProvider, useToast } from './context/ToastContext.jsx';
import { ProfileProvider } from './context/ProfileContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
// --- Onboarding ---
import OnboardingSlides from './components/onboarding/OnboardingSlides.jsx';
import GuidedTour from './components/onboarding/GuidedTour.jsx';
import GlobalError from './components/GlobalError';
import { useOnlineStatus } from './hooks/useOnlineStatus';

// Componente interno que vive dentro do ToastProvider e pode usar useToast
function AppRoutes() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Onboarding: exibe antes do login se ainda não foi visto
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem('inksa_onboarding_done') !== 'true'
  );

  // Tour guiado: exibe após login se ainda não foi feito
  const [showTour, setShowTour] = useState(false);

  // Detecta transição para autenticado e dispara o tour
  useEffect(() => {
    if (!isLoading && isAuthenticated && localStorage.getItem('inksa_tour_done') !== 'true') {
      setShowTour(true);
    }
  }, [isAuthenticated, isLoading]);

  // Quando o usuário faz logout, permite reexibir o tour no próximo login
  useEffect(() => {
    if (!isAuthenticated) {
      setShowTour(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleUnauthorized = () => {
      addToast('error', 'Sessão expirada, faça login novamente');
      navigate('/login', { replace: true });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [addToast, navigate]);

  const isOnline = useOnlineStatus();
  const wasOnlineRef = useRef(null);
  useEffect(() => {
    if (wasOnlineRef.current === null) { wasOnlineRef.current = isOnline; return; }
    if (isOnline && !wasOnlineRef.current) addToast('success', 'Conexão restaurada');
    if (!isOnline && wasOnlineRef.current) addToast('error', 'Você está offline');
    wasOnlineRef.current = isOnline;
  }, [isOnline, addToast]);

  return (
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

      {/* Overlays de onboarding — renderizados sobre todas as rotas */}
      {showOnboarding && (
        <OnboardingSlides
          onComplete={() => {
            localStorage.setItem('inksa_onboarding_done', 'true');
            setShowOnboarding(false);
          }}
        />
      )}
      {showTour && (
        <GuidedTour onComplete={() => setShowTour(false)} />
      )}
      <GlobalError />
    </ProfileProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
