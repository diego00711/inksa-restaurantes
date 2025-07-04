import React from 'react';

// Nenhum outro import é necessário para este teste.
// A importação do CSS principal deve estar no seu arquivo 'src/main.jsx'.

function App() {
  return (
    // Este é o nosso container de teste.
    // Usamos classes simples do Tailwind para verificar se elas são aplicadas.
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-800 p-10">
      
      {/* Se esta caixa aparecer azul e com o texto branco, o Tailwind está a funcionar. */}
      <div className="bg-blue-500 text-white p-12 rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-bold">
          Teste de Estilo do Tailwind
        </h1>
        <p className="mt-4 text-lg">
          Se você vê esta caixa azul, a configuração está correta.
        </p>
      </div>

    </div>
  );
}

export default App;
