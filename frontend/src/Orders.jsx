import React, { useEffect, useState } from 'react';
import api from './api';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('co2-desc');

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

  // Filter and sort orders
  const filteredAndSortedOrders = orders
    .filter(o => {
      if (!searchTerm.trim()) return true; // Show all if search is empty
      const searchLower = searchTerm.toLowerCase();
      return (
        (o['Order Number'] && String(o['Order Number']).toLowerCase().includes(searchLower)) ||
        (o['Customer Country'] && String(o['Customer Country']).toLowerCase().includes(searchLower)) ||
        (o['Warehouse Country'] && String(o['Warehouse Country']).toLowerCase().includes(searchLower)) ||
        (o['Customer City'] && String(o['Customer City']).toLowerCase().includes(searchLower)) ||
        (o['Warehouse City'] && String(o['Warehouse City']).toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      const getCO2 = (order) => Number(order['CO2 Total'] || 0);
      const getDate = (order) => new Date(order.Date || 0).getTime();
      
      switch(sortBy) {
        case 'co2-asc':
          return getCO2(a) - getCO2(b);
        case 'co2-desc':
          return getCO2(b) - getCO2(a);
        case 'date-new':
          return getDate(b) - getDate(a);
        case 'date-old':
          return getDate(a) - getDate(b);
        default:
          return 0;
      }
    });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-blue-200" />
        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
      </div>
    </div>
  );
  
  if (error) return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200">
        {error}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="max-w-[95%] 2xl:max-w-[1800px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 rounded-2xl p-8 shadow-xl">
          {/* Animated background overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
          
          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-1">Orders Dashboard</h1>
                    <p className="text-blue-100 text-lg">Manage and analyze all shipments with detailed CO₂ emissions</p>
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex gap-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-6 py-3">
                  <div className="text-blue-100 text-xs font-semibold uppercase tracking-wide mb-1">Total Orders</div>
                  <div className="text-3xl font-bold text-white">{orders.length}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-6 py-3">
                  <div className="text-blue-100 text-xs font-semibold uppercase tracking-wide mb-1">Showing</div>
                  <div className="text-3xl font-bold text-white">{filteredAndSortedOrders.length}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/10 rounded-full blur-2xl"></div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number, city or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm font-medium"
          >
            <option value="co2-desc">🔥 Highest CO₂ First</option>
            <option value="co2-asc">🌱 Lowest CO₂ First</option>
            <option value="date-new">📅 Newest First</option>
            <option value="date-old">📅 Oldest First</option>
          </select>
        </div>

        {/* Results info - Removed as stats are now in header */}

        {/* Table */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gradient-to-r from-gray-50 to-white sticky top-0 z-10">
                <tr className="border-b border-gray-200">
                  <th className="w-12 px-2 py-3"></th>
                  <th className="w-32 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order</th>
                  <th className="w-28 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="w-40 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">From</th>
                  <th className="w-40 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">To</th>
                  <th className="w-48 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Modes</th>
                  <th className="w-20 px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Units</th>
                  <th className="w-28 px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Weight</th>
                  <th className="w-32 px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">CO₂</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedOrders.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-8 py-12 text-center text-gray-500">
                      <div className="text-lg font-semibold mb-1">No orders found</div>
                      <p className="text-sm">Try adjusting your search or filter criteria</p>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedOrders.map((o, i) => (
                    <React.Fragment key={i}>
                      <tr 
                        className={`border-b border-gray-100 transition-all duration-200 cursor-pointer ${
                          expandedOrder === i 
                            ? 'bg-blue-50 hover:bg-blue-100' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => toggleExpand(i)}
                      >
                        <td className="px-2 py-3 text-center">
                          {expandedOrder === i ? (
                            <ChevronUp size={16} className="text-blue-600 mx-auto" />
                          ) : (
                            <ChevronDown size={16} className="text-gray-400 mx-auto" />
                          )}
                        </td>
                        <td className="px-3 py-3 font-semibold text-gray-900 truncate" title={o['Order Number']}>{o['Order Number']}</td>
                        <td className="px-3 py-3 text-gray-600 truncate">{new Date(o.Date).toLocaleDateString()}</td>
                        <td className="px-3 py-3 text-gray-600 truncate" title={formatLocation(o['Warehouse City'], o['Warehouse Country'])}>{formatLocation(o['Warehouse City'], o['Warehouse Country'])}</td>
                        <td className="px-3 py-3 text-gray-600 truncate" title={formatLocation(o['Customer City'], o['Customer Country'])}>{formatLocation(o['Customer City'], o['Customer Country'])}</td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1 flex-nowrap overflow-x-auto">
                            {getUsedModes(o).map(mode => (
                              <span key={mode} className={`px-2 py-0.5 text-xs rounded font-semibold text-white whitespace-nowrap ${
                                mode === 'Road' ? 'bg-yellow-500' :
                                mode === 'Rail' ? 'bg-blue-600' :
                                mode === 'Sea' ? 'bg-cyan-500' :
                                'bg-purple-600'
                              }`}>
                                {mode}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-gray-900">{Number(o.Units || 0).toFixed(0)}</td>
                        <td className="px-3 py-3 text-right text-gray-600">{Number(o.KG || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                        <td className="px-3 py-3 text-right">
                          <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 rounded font-bold text-xs">
                            {Number(o['CO2 Total'] || 0).toFixed(1)}
                          </span>
                        </td>
                      </tr>
                      {expandedOrder === i && (
                        <tr className="bg-blue-50 border-b border-gray-100">
                          <td colSpan="9" className="px-10 py-8">
                            <div>
                              <h4 className="font-bold text-gray-900 mb-5 text-xl">CO₂ Emissions by Transport Mode</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                {modes.map(mode => {
                                  const distance = Number(o[mode] || 0);
                                  const co2 = Number(o[`CO2 ${mode}`] || 0);
                                  const isUsed = distance > 0 || co2 > 0;
                                  
                                  const bgColor = 
                                    mode === 'Road' ? 'bg-yellow-50 border-yellow-200 hover:shadow-yellow-100' :
                                    mode === 'Rail' ? 'bg-blue-50 border-blue-200 hover:shadow-blue-100' :
                                    mode === 'Sea' ? 'bg-cyan-50 border-cyan-200 hover:shadow-cyan-100' :
                                    'bg-purple-50 border-purple-200 hover:shadow-purple-100';
                                  
                                  const badgeColor =
                                    mode === 'Road' ? 'bg-yellow-500' :
                                    mode === 'Rail' ? 'bg-blue-600' :
                                    mode === 'Sea' ? 'bg-cyan-500' :
                                    'bg-purple-600';

                                  return (
                                    <div 
                                      key={mode} 
                                      className={`p-5 rounded-xl border-2 transition-all duration-200 ${
                                        isUsed 
                                          ? `${bgColor} border-current shadow-md` 
                                          : 'bg-gray-100 border-gray-200 opacity-50'
                                      }`}
                                    >
                                      <div className={`inline-block px-3 py-1.5 rounded-lg text-sm font-bold text-white mb-3 ${badgeColor}`}>
                                        {mode}
                                      </div>
                                      <div className="text-base space-y-2">
                                        <p className="text-gray-700">
                                          Distance: <span className="font-semibold text-gray-900">{distance.toFixed(0)} km</span>
                                        </p>
                                        <p className="text-gray-900 font-bold text-lg mt-2">
                                          CO₂: <span className={isUsed ? 'text-red-600' : 'text-gray-400'}>{co2.toFixed(2)} kg</span>
                                        </p>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
