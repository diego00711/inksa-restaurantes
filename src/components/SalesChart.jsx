// src/components/SalesChart.jsx

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formatCurrency = (value) => `R$ ${value.toFixed(2)}`;

const formatXAxis = (tickItem) => {
  const date = new Date(tickItem + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export function SalesChart({ data }) {
  const chartData = data.slice().reverse();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis dataKey="dia" tickFormatter={formatXAxis} />
        <YAxis tickFormatter={formatCurrency} />
        <Tooltip
          formatter={(value) => [formatCurrency(value), 'Vendas']}
          labelFormatter={(label) => `Dia: ${formatXAxis(label)}`}
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
        />
        <Legend formatter={() => 'Vendas no Dia'} />
        <Bar dataKey="total" fill="#ff8c00" name="Vendas no Dia" />
      </BarChart>
    </ResponsiveContainer>
  );
}
