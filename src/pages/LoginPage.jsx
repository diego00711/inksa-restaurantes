// src/pages/LoginPage.jsx - VERSÃO FINAL CORRIGIDA

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx'; // Importando o useToast
import { requestNotificationPermission, saveFcmToken } from '../services/notificationService';
import { createAuthHeaders, RESTAURANT_API_URL } from '../services/api';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Removido o estado de erro local para usar o toast, que é mais moderno.
  const [isLoading, setIsLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast(); // Usando o hook de toast

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      // ✅ CORREÇÃO PRINCIPAL: Passando email e password como argumentos separados,
      // como a função authService.login espera.
      const loginData = await authService.login(email, password);

      // A resposta (loginData) já é o objeto { token, user, message }
      if (loginData && loginData.user && loginData.token) {
        // Atualiza o contexto global de autenticação
        login(loginData.user, loginData.token);

        // FCM: solicita permissão e persiste token — falha silenciosa, nunca quebra o login
        try {
          const fcmToken = await requestNotificationPermission();
          if (fcmToken) {
            await saveFcmToken(fcmToken, RESTAURANT_API_URL, createAuthHeaders());
          }
        } catch (_fcmErr) { /* intencional: ignorado */ }

        addToast('success', 'Login realizado com sucesso!');

        // Redireciona para a página de pedidos após o login
        navigate('/pedidos');
      } else {
        // Fallback de segurança caso a resposta não venha como esperado
        throw new Error('Resposta de login inválida do servidor.');
      }

    } catch (err) {
      // Usa o sistema de toast para exibir o erro de forma não-bloqueante
      addToast('error', err.message || 'Email ou senha inválidos.');
      console.error("Falha no login:", err);
    } finally {
      // Garante que o botão de login seja reativado
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="p-8 bg-white rounded-xl shadow-md w-full max-w-sm">
        <div className="text-center mb-6">
          <img src="/inka-logo.png" alt="Inksa Logo" className="h-10 w-auto mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Acesse sua Conta</h1>
          <p className="text-gray-500 text-sm">Bem-vindo de volta!</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
              <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-10 px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"} tabIndex={-1} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* O erro agora é tratado pelo Toast, então o <p> de erro pode ser removido se preferir */}

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-orange-300 min-h-[44px]"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
      
      <p className="mt-6 text-center text-sm text-gray-600">
        Não tem uma conta?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
