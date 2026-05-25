import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { PortalLayout } from './components/restaurant-portal/PortalLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastProvider, useToast } from './context/ToastContext.jsx';
import { ProfileProvider } from './context/ProfileContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import OnboardingSlides from './components/onboarding/OnboardingSlides.jsx';
import GuidedTour from './components/onboarding/GuidedTour.jsx';
import GlobalError from './components/GlobalError';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import WakingUpScreen from './components/WakingUpScreen';

// --- Lazy-loaded pages ---
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage').then(m => ({ default: m.OrdersPage })));
const MenuPage = lazy(() => import('./pages/MenuPage').then(m => ({ default: m.MenuPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const CategoryManagementPage = lazy(() => import('./pages/CategoryManagementPage').then(m => ({ default: m.CategoryManagementPage })));
const RestaurantGamificationPage = lazy(() => import('./pages/RestaurantGamificationPage'));
const RestaurantEvaluationsCenter = lazy(() => import('./pages/RestaurantEvaluationsCenter'));
const FinancePage = lazy(() => import('./pages/FinancePage'));

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
  </div>
);

function AppRoutes() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [serverReady, setServerReady] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem('inksa_onboarding_done') !== 'true'
  );
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && localStorage.getItem('inksa_tour_done') !== 'true') {
      setShowTour(true);
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (!isAuthenticated) setShowTour(false);
  }, [isAuthenticated]);

  useEffect(() => {
    const handleUnauthorized = () => {
      addToast('error', 'Sessão expirada, faça login novamente');
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
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
      <WakingUpScreen onReady={() => setServerReady(true)} />
      {serverReady && (
        <>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <PortalLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/pedidos" replace />} />
                <Route path="pedidos" element={<OrdersPage />} />
                <Route path="cardapio" element={<MenuPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="configuracoes" element={<SettingsPage />} />
                <Route path="categorias" element={<CategoryManagementPage />} />
                <Route path="gamificacao" element={<RestaurantGamificationPage />} />
                <Route path="avaliacoes" element={<RestaurantEvaluationsCenter />} />
                <Route path="financeiro" element={<FinancePage />} />
              </Route>

              <Route path="/dashboard" element={<Navigate to="/pedidos" replace />} />
            </Routes>
          </Suspense>

          {showOnboarding && (
            <OnboardingSlides
              onComplete={() => {
                localStorage.setItem('inksa_onboarding_done', 'true');
                setShowOnboarding(false);
              }}
            />
          )}
          {showTour && <GuidedTour onComplete={() => setShowTour(false)} />}
          <GlobalError />
        </>
      )}
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
