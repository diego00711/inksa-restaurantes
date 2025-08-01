// src/pages/RegisterPage.jsx

import React from 'react';
// Importação do formulário de registro que já criamos
import { RestaurantRegisterForm } from '../components/RestaurantRegisterForm'; 

export default function RegisterPage() {
  return (
    // O conteúdo retornado precisa ser um elemento JSX válido
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      {/* Você pode adicionar um cabeçalho ou logo aqui se desejar */}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Crie sua Conta de Restaurante</h1>
      
      {/* Renderiza o componente do formulário que importamos */}
      <RestaurantRegisterForm />
    </div>
  );
}