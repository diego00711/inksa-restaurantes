// components/TestReviewServices.jsx
// COMPONENTE TEMPORÁRIO APENAS PARA TESTAR A INTEGRAÇÃO

import React, { useState } from 'react';
import { restaurantReviewService, clientReviewService, deliveryReviewService } from '../services/reviewServices';
import { RESTAURANT_API_URL } from '../services/api';

export default function TestReviewServices() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState('');
  const [error, setError] = useState('');

  // Teste 1: Verificar se consegue carregar avaliações do restaurante
  const testLoadRestaurantReviews = async () => {
    setLoading(true);
    setError('');
    setResults('');
    
    try {
      // Substitua por um ID real do seu restaurante
      const restaurantId = 'seu-restaurant-id-aqui'; // ⚠️ ALTERE ESTE ID
      
      const data = await restaurantReviewService.getRestaurantReviews(restaurantId);
      setResults(`✅ Sucesso! Encontradas ${data.total_reviews} avaliações. Média: ${data.average_rating}`);
    } catch (err) {
      setError(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Teste 2: Verificar configuração da API
  const testApiConfig = () => {
    const apiUrl = RESTAURANT_API_URL;
    const token = localStorage.getItem('authToken');
    
    setResults(`
📋 Configuração Atual:
• API URL: ${apiUrl}
• Token existe: ${token ? '✅ Sim' : '❌ Não'}
• Token preview: ${token ? token.substring(0, 20) + '...' : 'N/A'}
    `);
  };

  // Teste 3: Verificar se consegue fazer requisição básica
  const testApiConnection = async () => {
    setLoading(true);
    setError('');
    setResults('');
    
    try {
      const apiUrl = RESTAURANT_API_URL;
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setResults('✅ API está respondendo!');
      } else {
        setError(`❌ API respondeu com status: ${response.status}`);
      }
    } catch (err) {
      setError(`❌ Erro de conexão: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        🧪 Teste de Integração - Review Services
      </h2>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testApiConfig}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-4"
        >
          📋 Verificar Configuração
        </button>
        
        <button
          onClick={testApiConnection}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mr-4 disabled:opacity-50"
        >
          🔗 Testar Conexão API
        </button>
        
        <button
          onClick={testLoadRestaurantReviews}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          ⭐ Carregar Avaliações
        </button>
      </div>

      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-blue-700">Testando...</span>
          </div>
        </div>
      )}

      {results && (
        <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
          <h3 className="font-semibold text-green-800 mb-2">Resultados:</h3>
          <pre className="text-green-700 text-sm whitespace-pre-wrap">{results}</pre>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <h3 className="font-semibold text-red-800 mb-2">Erro:</h3>
          <pre className="text-red-700 text-sm whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded p-4">
        <h3 className="font-semibold text-gray-800 mb-2">Instruções:</h3>
        <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
          <li>Primeiro clique em "Verificar Configuração" para ver se está tudo ok</li>
          <li>Clique em "Testar Conexão API" para verificar se consegue acessar o backend</li>
          <li>Se tudo estiver ok, clique em "Carregar Avaliações" (precisa alterar o restaurant ID no código)</li>
          <li>Depois de testar, remova este componente</li>
        </ol>
      </div>
    </div>
  );
}
