import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export function SummaryCard({ title, value, icon: Icon, color }) {
  return (
    <div className={`p-4 rounded-lg shadow-sm ${color} text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm opacity-90">{title}</div>
          <div className="text-2xl font-bold mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        </div>
        <div className="opacity-80">
          {Icon && <Icon size={36} />}
        </div>
      </div>
    </div>
  );
}

export function LoadingSpinner() {
  return <div className="p-8 text-center">Loading...</div>;
}

export function ErrorMessage({ message }) {
  return <div className="p-4 bg-red-50 text-red-700 rounded">{message}</div>;
}

export function DataTable({ data = [], columns = [], title }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 overflow-x-auto">
      {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2 text-left">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t hover:bg-gray-50">
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-2 ${c.align === 'right' ? 'text-right' : ''}`}>
                  {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PieChartComponent({ data = [], title = '', colors = [] }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 220, height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={3}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => `${Number(val).toFixed(2)} kg`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div>
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-3 mb-2">
              <div style={{ width: 14, height: 14, background: colors[i % colors.length] }} className="rounded-sm" />
              <div className="text-sm">
                <div className="font-semibold">{d.name}</div>
                <div className="text-xs text-gray-600">{((d.value/total)*100 || 0).toFixed(1)}% · {Number(d.value || 0).toFixed(2)} kg</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BarChartComponent({ data = [], title = '', dataKey = 'value', colors = ['#3b82f6'] }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey={dataKey} fill={colors[0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
