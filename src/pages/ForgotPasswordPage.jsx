// src/pages/ForgotPasswordPage.jsx (CORRIGIDO)

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
// ✅ CORREÇÃO 1: A importação agora é nomeada, usando { chaves }.
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext.jsx';
import { Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const addToast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // ✅ CORREÇÃO 2: A chamada usa 'authService' (minúsculo).
      const response = await authService.forgotPassword(email);
      addToast(response.message, 'success');
      setEmail(''); 
    } catch (error) {
      addToast(error.message || 'Ocorreu um erro ao enviar o e-mail.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // O restante do seu código JSX continua igual.
  return (
    <div className="flex items-center justify-center min-h-screen bg-orange-50 font-sans">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
                <Mail className="h-6 w-6 text-indigo-600" aria-hidden="true" />
            </div>
          <h2 className="mt-4 text-2xl font-bold text-center text-gray-900">
            Recuperar Senha
          </h2>
          <p className="mt-2 text-sm text-center text-gray-600">
            Sem problemas! Digite seu e-mail e enviaremos um link para você criar uma nova senha.
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">Endereço de e-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Endereço de e-mail"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-colors"
            >
              {isLoading ? 'A Enviar...' : 'Enviar Link de Recuperação'}
            </button>
          </div>
        </form>
        <div className="text-sm text-center text-gray-500">
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Lembrou-se da senha? Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
}