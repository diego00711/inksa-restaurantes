// src/components/OrderDetailsModal.jsx - VERSÃO CORRIGIDA

import React, { useState, useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import { orderService } from '../services/orderService';
import { useToast } from '../context/ToastContext.jsx';

// O checkout do cliente grava a taxa de entrega como um ITEM do pedido, além de
// ter a linha "Taxa de Entrega" própria (delivery_fee) — mostrar os dois é
// redundante. Aqui a gente esconde só esse item da LISTA. Discriminador seguro:
// item de comida sempre tem menu_item_id; o de taxa não, e o título casa com
// "taxa de entrega"/"frete". Exige as duas condições pra nunca esconder comida.
const isDeliveryFeeItem = (item) => {
  const title = String(item?.title || item?.name || '').trim().toLowerCase();
  const semMenuItem = !item?.menu_item_id;
  return semMenuItem && (title === 'taxa de entrega' || title === 'frete');
};

export function OrderDetailsModal({ order, onClose }) {
  const [fullOrderDetails, setFullOrderDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchDetails = async () => {
      if (!order || !order.id) {
        setIsLoading(false);
        setError("ID do pedido inválido.");
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        const details = await orderService.getOrderById(order.id);
        setFullOrderDetails(details);
      } catch (err) {
        console.error("Erro ao buscar detalhes do pedido:", err);
        const errorMessage = err.message || "Não foi possível carregar os detalhes do pedido.";
        setError(errorMessage);
        addToast('error', errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [order, addToast]);

  // ✅ Função auxiliar para formatar valores de forma segura
  const formatCurrency = (value) => {
    const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(numValue);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-100 text-yellow-800';
      case 'Aceito': return 'bg-blue-100 text-blue-800';
      case 'Preparando': return 'bg-indigo-100 text-indigo-800';
      case 'Pronto': return 'bg-purple-100 text-purple-800';
      case 'Aguardando Retirada': return 'bg-pink-100 text-pink-800';
      case 'accepted_by_delivery': return 'bg-pink-100 text-pink-800';
      case 'Saiu para Entrega': return 'bg-orange-100 text-orange-800';
      case 'delivering': return 'bg-orange-100 text-orange-800';
      case 'Entregue': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'Concluído': return 'bg-green-100 text-green-800';
      case 'Cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Comanda pra impressora térmica (bobina 80mm). Monta um HTML enxuto num
  // iframe escondido e chama print() só nele — assim a impressão sai formatada
  // pro papel estreito sem envolver o layout do app. Se o parceiro não tiver
  // térmica, a mesma caixa de diálogo imprime em qualquer impressora / PDF.
  const handlePrint = () => {
    if (!fullOrderDetails) return;
    const esc = (s) =>
      String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const d = fullOrderDetails;
    const shortId = order.id ? String(order.id).substring(0, 8) : 'N/A';
    const clientName =
      d.client_name ||
      [d.client_first_name, d.client_last_name].filter(Boolean).join(' ') ||
      'Não informado';
    const address =
      typeof d.delivery_address === 'string'
        ? d.delivery_address
        : d.delivery_address?.street || 'Não informado';
    const items = (d.items || []).filter((i) => !isDeliveryFeeItem(i));
    const now = new Date().toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const itemsHtml = items.length
      ? items
          .map(
            (i) =>
              `<div class="row"><span class="l">${esc(i.quantity || 1)}x ${esc(
                i.title || i.name || 'Item'
              )}</span><span class="r">${esc(formatCurrency(i.unit_price ?? i.price))}</span></div>`
          )
          .join('')
      : '<div class="center muted">Nenhum item</div>';
    const subtotal = d.total_amount_items
      ? `<div class="row"><span>Subtotal</span><span class="r">${esc(formatCurrency(d.total_amount_items))}</span></div>`
      : '';
    const fee = d.delivery_fee
      ? `<div class="row"><span>Taxa de entrega</span><span class="r">${esc(formatCurrency(d.delivery_fee))}</span></div>`
      : '';
    const notes = d.notes
      ? `<div class="hr"></div><div class="muted"><b>Obs:</b> ${esc(d.notes)}</div>`
      : '';

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Pedido ${esc(shortId)}</title><style>
      @page{size:80mm auto;margin:0}
      *{margin:0;padding:0;box-sizing:border-box}
      body{width:80mm;padding:4mm 3mm;font-family:'Courier New',monospace;font-size:12px;line-height:1.35;color:#000}
      .center{text-align:center}.big{font-size:17px;font-weight:bold;letter-spacing:2px}
      .hr{border-top:1px dashed #000;margin:6px 0}
      .row{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
      .row .l{flex:1}.row .r{white-space:nowrap}
      .muted{font-size:11px}.total{font-weight:bold;font-size:14px}.mt{margin-top:4px}
    </style></head><body>
      <div class="center big">PEDIDO</div>
      <div class="center">#${esc(shortId)}</div>
      <div class="center muted">${esc(now)}</div>
      <div class="hr"></div>
      <div><b>Cliente:</b> ${esc(clientName)}</div>
      <div class="mt"><b>Entrega:</b> ${esc(address)}</div>
      <div class="hr"></div>
      ${itemsHtml}
      <div class="hr"></div>
      ${subtotal}${fee}
      <div class="row total mt"><span>TOTAL</span><span class="r">${esc(formatCurrency(d.total_amount))}</span></div>
      ${notes}
      <div class="hr"></div>
      <div class="center muted">Inksa Delivery</div>
    </body></html>`;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
    document.body.appendChild(iframe);
    const removeIframe = () => {
      try { document.body.removeChild(iframe); } catch { /* já removido */ }
    };
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    const win = iframe.contentWindow;
    win.onafterprint = removeIframe;
    // fallback: se onafterprint não disparar (varia por navegador), limpa depois
    setTimeout(removeIframe, 60000);
    // pequeno atraso pro layout aplicar antes de abrir a caixa de impressão
    setTimeout(() => { win.focus(); win.print(); }, 200);
  };

  const modalBackdropStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex',
    justifyContent: 'center', alignItems: 'center', zIndex: 2000,
  };

  return (
    <div style={modalBackdropStyle} onClick={onClose}>
      <div className="bg-white p-4 sm:p-8 rounded-lg shadow-xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto mx-4" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
          Detalhes do Pedido #{order.id ? String(order.id).substring(0, 8) : 'N/A'}...
        </h2>

        {isLoading ? (
          <p className="text-center text-gray-600 py-8">Carregando detalhes...</p>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-2">❌ {error}</p>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium"
            >
              Fechar
            </button>
          </div>
        ) : fullOrderDetails ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <p className="text-lg font-semibold text-gray-700">Status:</p>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusClass(fullOrderDetails.status)}`}>
                {fullOrderDetails.status}
              </span>
            </div>

            <div className="border-b pb-2">
              <p className="text-lg font-semibold text-gray-700 mb-1">Cliente:</p>
              <p className="text-gray-600">
                {fullOrderDetails.client_name ||
                  (fullOrderDetails.client_first_name && fullOrderDetails.client_last_name
                    ? `${fullOrderDetails.client_first_name} ${fullOrderDetails.client_last_name}`
                    : fullOrderDetails.client_first_name || 'Nome não disponível')}
              </p>
            </div>

            <div className="border-b pb-2">
              <p className="text-lg font-semibold text-gray-700 mb-1">Endereço de Entrega:</p>
              <p className="text-gray-600">
                {typeof fullOrderDetails.delivery_address === 'string' 
                  ? fullOrderDetails.delivery_address 
                  : fullOrderDetails.delivery_address?.street || 'Não informado'}
              </p>
            </div>

            {fullOrderDetails.notes && (
              <div className="border-b pb-2">
                <p className="text-lg font-semibold text-gray-700 mb-1">Observações do Cliente:</p>
                <p className="text-gray-600 italic">{fullOrderDetails.notes}</p>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Itens do Pedido:</h3>
              <ul className="space-y-2">
                {(() => {
                  // Esconde o item de taxa de entrega (já tem linha própria).
                  const visibleItems = (fullOrderDetails.items || []).filter(i => !isDeliveryFeeItem(i));
                  return visibleItems.length > 0 ? (
                    visibleItems.map((item, index) => (
                      <li key={index} className="flex justify-between items-center text-gray-700 py-2 border-b border-gray-100">
                        <span className="flex-1">
                          {/* itens gravados pelo app cliente usam title/unit_price;
                              mantém name/price como fallback pra formatos antigos */}
                          <span className="font-medium">{item.quantity || 1}x</span> {item.title || item.name || 'Item sem nome'}
                        </span>
                        <span className="font-medium">{formatCurrency(item.unit_price ?? item.price)}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500 py-4 text-center">Nenhum item listado neste pedido.</li>
                  );
                })()}
              </ul>
            </div>

            {/* Subtotal e Taxas */}
            {fullOrderDetails.total_amount_items && (
              <div className="pt-2 space-y-1">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal dos Itens:</span>
                  <span>{formatCurrency(fullOrderDetails.total_amount_items)}</span>
                </div>
                {fullOrderDetails.delivery_fee && (
                  <div className="flex justify-between text-gray-700">
                    <span>Taxa de Entrega:</span>
                    <span>{formatCurrency(fullOrderDetails.delivery_fee)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Total */}
            <div className="text-right pt-4 border-t-2 border-gray-300">
              <p className="text-xl font-bold text-gray-900">
                Total do Pedido: {formatCurrency(fullOrderDetails.total_amount)}
              </p>
            </div>

            {/* Ações: imprimir comanda (térmica 80mm) + fechar */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors min-h-[44px]"
              >
                <Printer size={18} /> Imprimir comanda
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors min-h-[44px]"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-600 py-8">Detalhes do pedido não disponíveis.</p>
        )}
      </div>
    </div>
  );
}
