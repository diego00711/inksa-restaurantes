// src/components/PickupConfirmationModal.jsx
// Modal para restaurante confirmar que entregador retirou o pedido

import React, { useState } from 'react';
import { X, Package, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export function PickupConfirmationModal({ order, isOpen, onClose, onSuccess }) {
  const [pickupCode, setPickupCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  if (!isOpen || !order) return null;

  const handleConfirmPickup = async (e) => {
    e.preventDefault();
    setError('');

    // Validação básica
    if (!pickupCode || pickupCode.trim().length === 0) {
      setError('Digite o código de retirada');
      return;
    }

    if (pickupCode.trim().length !== 4) {
      setError('O código deve ter 4 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      // Chama o endpoint /pickup que já existe no backend
      const response = await api.post(`/api/orders/${order.id}/pickup`, {
        pickup_code: pickupCode.toUpperCase().trim()
      });

      addToast('Retirada confirmada! Pedido saiu para entrega.', 'success');
      
      // Reseta o formulário
      setPickupCode('');
      setError('');
      
      // Chama callback de sucesso para atualizar lista de pedidos
      if (onSuccess) {
        onSuccess();
      }
      
      // Fecha o modal
      onClose();
      
    } catch (err) {
      console.error('Erro ao confirmar retirada:', err);
      const errorMessage = err.response?.data?.error || 'Código inválido. Verifique e tente novamente.';
      setError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPickupCode('');
    setError('');
    onClose();
  };

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 4) {
      setPickupCode(value);
      setError('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Confirmar Retirada</h2>
              <p className="text-sm text-gray-500">Pedido #{order.id.substring(0, 8)}...</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Informações do Pedido */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Cliente:</span> {order.client_first_name} {order.client_last_name}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Total:</span> R$ {order.total_amount?.toFixed(2) || '0.00'}
          </p>
        </div>

        {/* Instruções */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>📱 Peça ao entregador</strong> para mostrar o código de retirada de 4 caracteres que aparece no pedido dele.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleConfirmPickup}>
          <div className="mb-4">
            <label htmlFor="pickupCode" className="block text-sm font-medium text-gray-700 mb-2">
              Código de Retirada *
            </label>
            <input
              id="pickupCode"
              type="text"
              value={pickupCode}
              onChange={handleInputChange}
              placeholder="Ex: LHRG"
              maxLength={4}
              className={`w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                error 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300 bg-white'
              }`}
              disabled={isLoading}
              autoFocus
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              Digite os 4 caracteres do código
            </p>
          </div>

          {/* Erro */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:bg-purple-300 disabled:cursor-not-allowed"
              disabled={isLoading || pickupCode.length !== 4}
            >
              {isLoading ? 'Confirmando...' : 'Confirmar Retirada'}
            </button>
          </div>
        </form>

        {/* Rodapé informativo */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            ✅ Ao confirmar, o pedido será marcado como "Em rota de entrega"
          </p>
        </div>
      </div>
    </div>
  );
}
