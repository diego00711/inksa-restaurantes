// src/pages/LoginPage.jsx (CORRIGIDO)

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// A importação já estava correta, usando chaves { }
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext.jsx'; // Importa o hook do contexto

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // Pega a função de login do nosso contexto

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // --- CORREÇÃO APLICADA AQUI ---
      // A chamada agora usa 'authService' (minúsculo), que corresponde ao que foi importado.
      // O tipo 'restaurant' já é fixo dentro do serviço, então não precisa ser passado aqui.
      const response = await authService.login(email, password);

      // Verifica se a resposta da API foi bem-sucedida e contém os dados esperados
      if (response && response.data && response.data.user && response.access_token) {
        
        // Chama a função de login do AuthContext para atualizar o estado global na aplicação
        login(response.data.user, response.access_token);

        // Redireciona para a página de pedidos após o login bem-sucedido
        navigate('/pedidos');

      } else {
        // Caso a resposta da API não venha como o esperado
        throw new Error(response.message || 'Resposta de login inválida do servidor.');
      }
      
    } catch (err) {
      // Define uma mensagem de erro amigável para o utilizador
      setError(err.message || 'Email ou senha inválidos. Por favor, tente novamente.');
      console.error("Falha no login:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // O resto do seu componente JSX continua igual, pois já está ótimo.
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

          {error && <p className="text-red-500 text-center text-sm">{error}</p>}

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