// src/pages/RegisterPage.jsx (NOVO)

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext.jsx';
import { Loader } from 'lucide-react';

// Exportado como uma função nomeada, para ser compatível com o seu App.jsx
export function RegisterPage() {
    const [formData, setFormData] = useState({
        restaurant_name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading) return;

        // Validação de senha
        if (formData.password !== formData.confirmPassword) {
            addToast('As senhas não coincidem.', 'error');
            return;
        }
        if (formData.password.length < 6) {
            addToast('A senha deve ter no mínimo 6 caracteres.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            // Prepara os dados para enviar à API
            const registrationData = {
                email: formData.email,
                password: formData.password,
                // Adiciona os dados extras que a sua API de registo deve esperar
                options: {
                    data: {
                        restaurant_name: formData.restaurant_name,
                        phone: formData.phone,
                        user_type: 'restaurant' // Define o tipo de utilizador
                    }
                }
            };

            await authService.register(registrationData);
            
            addToast('Registo realizado com sucesso! Por favor, faça o login.', 'success');
            navigate('/login'); // Redireciona para a página de login

        } catch (err) {
            console.error("Erro no registo:", err);
            addToast(err.message || 'Ocorreu um erro ao tentar registar.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">Crie a Sua Conta</h1>
                    <p className="mt-2 text-gray-600">Comece a gerir o seu restaurante na nossa plataforma.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="restaurant_name" className="block text-sm font-medium text-gray-700">
                            Nome do Restaurante
                        </label>
                        <input
                            id="restaurant_name"
                            name="restaurant_name"
                            type="text"
                            required
                            value={formData.restaurant_name}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Telefone
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Senha
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                     <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            Confirmar Senha
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                        >
                            {isLoading ? <Loader className="animate-spin" /> : 'Registar'}
                        </button>
                    </div>
                </form>
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Já tem uma conta?{' '}
                        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Faça o login aqui
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}