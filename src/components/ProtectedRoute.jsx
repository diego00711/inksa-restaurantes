// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 1. Se ainda estamos verificando a autenticação (carregamento inicial do app),
  //    mostramos uma tela de carregamento para evitar um "flash" da tela de login.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Carregando...
      </div>
    );
  }

  // 2. Se o carregamento terminou e o usuário NÃO está autenticado,
  //    redirecionamos para a página de login.
  if (!isAuthenticated) {
    // `state={{ from: location }}` é opcional, mas útil para redirecionar
    // o usuário de volta para a página que ele tentou acessar após o login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Se o usuário está autenticado, renderizamos o componente filho
  //    (no seu caso, o PortalLayout com todas as páginas do dashboard).
  return children;
}
