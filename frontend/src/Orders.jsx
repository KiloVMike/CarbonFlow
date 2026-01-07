import React, { useEffect, useState } from 'react';
import api from './api';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      // request a large page size to get all orders; backend supports pagination
      const res = await api.getOrders(1, 2000);
      setOrders(res.data.orders || []);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (orderIndex) => {
    setExpandedOrder(expandedOrder === orderIndex ? null : orderIndex);
  };

  const modes = ['Road', 'Rail', 'Sea', 'Air'];

  const getUsedModes = (order) => {
    return modes.filter(mode => {
      const distance = Number(order[mode] || 0);
      const co2 = Number(order[`CO2 ${mode}`] || 0);
      return distance > 0 || co2 > 0;
    });
  };

  const formatLocation = (city, country) => {
    const parts = [];
    if (city && String(city).trim() !== '') parts.push(String(city).trim());
    if (country && String(country).trim() !== '') parts.push(String(country).trim());
    return parts.length ? parts.join(', ') : '—';
  };

  if (loading) return <div className="p-6">Loading orders...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-4">All Orders</h2>
        <p className="text-gray-600 mb-6 text-sm">Click on any order row to expand and see CO2 emissions by transport mode</p>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="w-6"></th>
                <th className="px-3 py-2 text-left">Order</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">From</th>
                <th className="px-3 py-2 text-left">To</th>
                <th className="px-3 py-2 text-left">Transports Used</th>
                <th className="px-3 py-2 text-right">Units</th>
                <th className="px-3 py-2 text-right">KG</th>
                <th className="px-3 py-2 text-right">Total CO2 (kg)</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <React.Fragment key={i}>
                  <tr 
                    className="border-t hover:bg-blue-50 cursor-pointer"
                    onClick={() => toggleExpand(i)}
                  >
                    <td className="px-2 py-2 text-center">
                      {expandedOrder === i ? (
                        <ChevronUp size={18} className="text-blue-600" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400" />
                      )}
                    </td>
                    <td className="px-3 py-2 font-semibold">{o['Order Number']}</td>
                    <td className="px-3 py-2">{new Date(o.Date).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{formatLocation(o['Warehouse City'], o['Warehouse Country'])}</td>
                    <td className="px-3 py-2">{formatLocation(o['Customer City'], o['Customer Country'])}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 flex-wrap">
                        {getUsedModes(o).map(mode => (
                          <span key={mode} className={`px-2 py-1 text-xs rounded font-semibold text-white ${
                            mode === 'Road' ? 'bg-yellow-600' :
                            mode === 'Rail' ? 'bg-blue-600' :
                            mode === 'Sea' ? 'bg-cyan-600' :
                            'bg-purple-600'
                          }`}>
                            {mode}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">{Number(o.Units || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{Number(o.KG || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-red-700">{Number(o['CO2 Total'] || 0).toFixed(2)}</td>
                  </tr>
                  {expandedOrder === i && (
                    <tr className="bg-gray-50 border-t">
                      <td colSpan="9" className="px-3 py-4">
                        <div className="ml-8">
                          <h4 className="font-semibold text-gray-800 mb-3">CO2 Emissions by Transport Mode</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {modes.map(mode => {
                              const distance = Number(o[mode] || 0);
                              const co2 = Number(o[`CO2 ${mode}`] || 0);
                              const isUsed = distance > 0 || co2 > 0;
                              
                              const bgColor = 
                                mode === 'Road' ? 'bg-yellow-50 border-yellow-200' :
                                mode === 'Rail' ? 'bg-blue-50 border-blue-200' :
                                mode === 'Sea' ? 'bg-cyan-50 border-cyan-200' :
                                'bg-purple-50 border-purple-200';
                              
                              const badgeColor =
                                mode === 'Road' ? 'bg-yellow-600' :
                                mode === 'Rail' ? 'bg-blue-600' :
                                mode === 'Sea' ? 'bg-cyan-600' :
                                'bg-purple-600';

                              return (
                                <div key={mode} className={`p-3 rounded-lg border-2 ${isUsed ? bgColor : 'bg-gray-100 border-gray-200 opacity-50'}`}>
                                  <div className={`inline-block px-2 py-1 rounded text-xs font-bold text-white mb-2 ${badgeColor}`}>
                                    {mode}
                                  </div>
                                  <div className="text-sm">
                                    <p className="text-gray-600">Distance: <span className="font-semibold">{distance.toFixed(2)} km</span></p>
                                    <p className="text-gray-800 font-bold text-base mt-1">CO2: <span className={isUsed ? 'text-red-600' : 'text-gray-400'}>{co2.toFixed(2)} kg</span></p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
