// src/data/mock-menu.js

export const mockMenu = [
  {
    id: 'p1',
    name: 'Pizza Calabresa',
    description: 'Molho de tomate especial, mussarela fresca, calabresa fatiada e orégano.',
    price: 45.00,
    category: 'Pizzas',
    isAvailable: true,
  },
  {
    id: 'p2',
    name: 'Pizza Margherita',
    description: 'Molho de tomate, mussarela de búfala, rodelas de tomate e folhas de manjericão.',
    price: 42.00,
    category: 'Pizzas',
    isAvailable: true,
  },
  {
    id: 'h1',
    name: 'Hambúrguer Clássico',
    description: 'Pão brioche, hambúrguer de 180g, queijo cheddar, alface, tomate e molho da casa.',
    price: 32.00,
    category: 'Hambúrgueres',
    isAvailable: true,
  },
  {
    id: 'b1',
    name: 'Coca-Cola Lata',
    description: 'Lata de 350ml gelada.',
    price: 7.00,
    category: 'Bebidas',
    isAvailable: false, // Exemplo de item indisponível
  },
   {
    id: 's1',
    name: 'Petit Gâteau',
    description: 'Bolo de chocolate com recheio cremoso, servido com sorvete de creme.',
    price: 22.50,
    category: 'Sobremesas',
    isAvailable: true,
  },
];