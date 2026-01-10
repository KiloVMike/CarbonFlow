import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

export function SummaryCard({ title, value, icon: Icon, color }) {
  return (
    <div className={`relative overflow-hidden p-6 rounded-2xl shadow-lg text-white transition-all duration-300 hover:shadow-2xl hover:scale-105 group ${color}`}>
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-white transition-opacity duration-300" />
      
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium opacity-90 tracking-wide uppercase">{title}</div>
          <div className="text-3xl lg:text-4xl font-bold mt-2 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 1 }) : value}
          </div>
        </div>
        <div className="opacity-70 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-110">
          {Icon && <Icon size={48} strokeWidth={1.5} />}
        </div>
      </div>
      
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 h-1 bg-white opacity-30 w-0 group-hover:w-full transition-all duration-500" />
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-blue-200" />
        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full bg-blue-50 flex items-center justify-center">
          <span className="text-xs font-semibold text-blue-600">Loading</span>
        </div>
      </div>
    </div>
  );
}

export function ErrorMessage({ message }) {
  return (
    <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 text-red-700 rounded-xl border border-red-200 shadow-sm flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5">
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div>
        <h3 className="font-semibold">Error</h3>
        <p className="text-sm mt-1">{message}</p>
      </div>
    </div>
  );
}

export function DataTable({ data = [], columns = [], title }) {
  const [hoveredRow, setHoveredRow] = React.useState(null);
  
  return (
    <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      {title && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr className="border-b border-gray-100">
              {columns.map((c) => (
                <th key={c.key} className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr 
                key={i} 
                className={`border-b border-gray-100 transition-colors duration-200 ${
                  hoveredRow === i ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onMouseEnter={() => setHoveredRow(i)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-6 py-4 ${c.align === 'right' ? 'text-right' : ''}`}>
                    <span className={c.align === 'right' ? 'font-medium text-gray-900' : 'text-gray-700'}>
                      {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PieChartComponent({ data = [], title = '', colors = [] }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: 240, height: 240, minWidth: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(val) => `${Number(val).toFixed(2)} kg`}
                contentStyle={{ backgroundColor: '#f3f4f6', border: 'none', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-3 mb-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div style={{ width: 16, height: 16, background: colors[i % colors.length], borderRadius: '4px' }} />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-sm">{d.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {((d.value/total)*100 || 0).toFixed(1)}% • {Number(d.value || 0).toFixed(2)} kg
                </div>
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
    <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              formatter={(val) => [Number(val).toFixed(2), 'CO₂ (kg)']}
            />
            <Bar dataKey={dataKey} fill={colors[0]} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
