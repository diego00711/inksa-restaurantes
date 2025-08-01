// src/data/mock-orders.js

export const mockOrders = [
  {
    id: 'ORD001',
    clientName: 'Ana Silva',
    address: 'Rua das Flores, 123 - Centro',
    status: 'Pendente',
    items: [
      { name: 'Pizza Calabresa', quantity: 1, price: 45.00 },
      { name: 'Coca-Cola Lata', quantity: 2, price: 7.00 },
    ],
    total: 59.00,
  },
  {
    id: 'ORD002',
    clientName: 'Bruno Costa',
    address: 'Av. Principal, 456 - Bairro Novo',
    status: 'Aceito',
    items: [
      { name: 'Hambúrguer Clássico', quantity: 1, price: 32.00 },
      { name: 'Batata Frita G', quantity: 1, price: 15.00 },
    ],
    total: 47.00,
  },
  {
    id: 'ORD003',
    clientName: 'Carla Dias',
    address: 'Travessa da Paz, 78 - Vila Feliz',
    status: 'Em Preparo',
    items: [
      { name: 'Combinado 20 peças', quantity: 1, price: 89.00 },
    ],
    total: 89.00,
  },
  {
    id: 'ORD004',
    clientName: 'Daniel Rocha',
    address: 'Rua da Alegria, 90 - Centro',
    status: 'Pronto para Entrega',
    items: [
      { name: 'Pizza Margherita', quantity: 1, price: 42.00 },
    ],
    total: 42.00,
  },
];