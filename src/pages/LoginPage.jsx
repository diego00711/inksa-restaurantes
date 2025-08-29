// src/pages/LoginPage.jsx - VERSÃO FINAL CORRIGIDA

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx'; // Importando o useToast

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Removido o estado de erro local para usar o toast, que é mais moderno.
  const [isLoading, setIsLoading] = useState(false);
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
        
        addToast('Login realizado com sucesso!', 'success');
        
        // Redireciona para a página de pedidos após o login
        navigate('/pedidos');
      } else {
        // Fallback de segurança caso a resposta não venha como esperado
        throw new Error('Resposta de login inválida do servidor.');
      }
      
    } catch (err) {
      // Usa o sistema de toast para exibir o erro de forma não-bloqueante
      addToast(err.message || 'Email ou senha inválidos.', 'error');
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>

          {/* O erro agora é tratado pelo Toast, então o <p> de erro pode ser removido se preferir */}

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-orange-300"
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
