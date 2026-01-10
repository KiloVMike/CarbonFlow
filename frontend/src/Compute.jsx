import React, { useState } from 'react'
import { Plus, X, Zap, Package, MapPin } from 'lucide-react'

function Compute() {
  const [warehouse, setWarehouse] = useState('')
  const [customer, setCustomer] = useState('')
  const [mode, setMode] = useState('auto')
  const [distance, setDistance] = useState('')
  const [items, setItems] = useState([{ id: 1, code: '', units: '' }])
  const [transports, setTransports] = useState([{ id: 1, mode: 'Road', distance: '' }])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('basic')

  const addItem = () => {
    setItems([...items, { id: Date.now(), code: '', units: '' }])
  }

  const removeItem = (idx) => {
    const copy = items.slice()
    copy.splice(idx, 1)
    setItems(copy.length > 0 ? copy : [{ id: Date.now(), code: '', units: '' }])
  }

  const addTransport = () => {
    setTransports([...transports, { id: Date.now(), mode: 'Road', distance: '' }])
  }

  const updateTransport = (idx, key, value) => {
    const copy = transports.slice()
    copy[idx][key] = value
    setTransports(copy)
  }

  const removeTransport = (idx) => {
    const copy = transports.slice()
    copy.splice(idx, 1)
    setTransports(copy.length > 0 ? copy : [{ id: Date.now(), mode: 'Road', distance: '' }])
  }

  const updateItem = (idx, key, value) => {
    const copy = items.slice()
    copy[idx][key] = value
    setItems(copy)
  }

  const submit = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    const payload = {
      warehouse_code: warehouse || null,
      customer_code: customer || null,
      mode: mode || 'auto',
      distance_km: distance ? Number(distance) : null,
      items: items.map(i => ({ 'Item Code': i.code, Units: Number(i.units || 0) }))
    }

    const distances = {}
    transports.forEach(t => {
      if (!t.mode) return
      const d = Number(t.distance || 0)
      if (!distances[t.mode]) distances[t.mode] = 0
      distances[t.mode] += d
    })

    if (Object.values(distances).some(v => v > 0)) {
      payload.distances = distances
      payload.distance_km = null
      payload.mode = 'auto'
    }

    try {
      const res = await fetch('http://localhost:5000/api/compute-emission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setResult(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const modeColors = {
    'Road': 'bg-yellow-500',
    'Rail': 'bg-blue-600',
    'Sea': 'bg-cyan-500',
    'Air': 'bg-purple-600'
  }

  const modeBgColors = {
    'Road': 'bg-yellow-50 border-yellow-200',
    'Rail': 'bg-blue-50 border-blue-200',
    'Sea': 'bg-cyan-50 border-cyan-200',
    'Air': 'bg-purple-50 border-purple-200'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Compute CO₂ Emissions</h1>
          </div>
          <p className="text-gray-600 text-lg ml-11">Calculate detailed emission estimates for your shipments</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {[
            { id: 'basic', label: 'Route Info', icon: MapPin },
            { id: 'items', label: 'Items', icon: Package },
            { id: 'transport', label: 'Transport', icon: Zap }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-start gap-3">
            <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold mb-1">Error</h3>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Forms */}
        <div className="space-y-6">
          {/* Basic Info */}
          {activeTab === 'basic' && (
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Route Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Warehouse Code</label>
                  <input
                    value={warehouse}
                    onChange={e => setWarehouse(e.target.value)}
                    placeholder="e.g., WH001"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Customer Code</label>
                  <input
                    value={customer}
                    onChange={e => setCustomer(e.target.value)}
                    placeholder="e.g., CUST001"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-gray-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          {activeTab === 'items' && (
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Items to Ship</h3>
              <div className="space-y-3 mb-4">
                {items.map((it, idx) => (
                  <div key={it.id} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Item Code</label>
                      <input
                        placeholder="Item code"
                        value={it.code}
                        onChange={e => updateItem(idx, 'code', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
                      <input
                        type="number"
                        placeholder="Units"
                        value={it.units}
                        onChange={e => updateItem(idx, 'units', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                      />
                    </div>
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors duration-200"
              >
                <Plus size={18} />
                Add Item
              </button>
            </div>
          )}

          {/* Transport Legs */}
          {activeTab === 'transport' && (
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-gray-100 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Transport Legs</h3>
              <div className="space-y-3 mb-4">
                {transports.map((t, idx) => (
                  <div key={t.id} className="flex gap-3 items-end">
                    <select
                      value={t.mode}
                      onChange={e => updateTransport(idx, 'mode', e.target.value)}
                      className="px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-medium"
                    >
                      <option value="Road">🚚 Road</option>
                      <option value="Rail">🚆 Rail</option>
                      <option value="Sea">🚢 Sea</option>
                      <option value="Air">✈️ Air</option>
                    </select>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
                      <input
                        type="number"
                        placeholder="Distance in km"
                        value={t.distance}
                        onChange={e => updateTransport(idx, 'distance', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                      />
                    </div>
                    {transports.length > 1 && (
                      <button
                        onClick={() => removeTransport(idx)}
                        className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addTransport}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors duration-200"
              >
                <Plus size={18} />
                Add Transport Leg
              </button>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={submit}
            disabled={loading}
            className="group px-8 py-3.5 rounded-xl font-bold
                       bg-gradient-to-r from-blue-600 to-blue-500
                       text-white shadow-lg hover:shadow-xl
                       hover:scale-105 transition-all duration-200
                       flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap size={20} className="group-hover:animate-pulse" />
            {loading ? 'Computing...' : 'Calculate Emissions'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-green-900 mb-6 flex items-center gap-2">
              ✓ Calculation Complete
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100">
                <div className="text-sm font-medium text-gray-600 mb-1">Total Weight</div>
                <div className="text-3xl font-bold text-gray-900">{Number(result.total_kg).toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                <div className="text-xs text-gray-500 mt-1">kg</div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 shadow-sm border border-red-100">
                <div className="text-sm font-medium text-red-700 mb-1">Total CO₂</div>
                <div className="text-3xl font-bold text-red-700">{Number(result.total_co2).toFixed(2)}</div>
                <div className="text-xs text-red-600 mt-1">kg CO₂</div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="text-sm font-medium text-gray-600 mb-1">Status</div>
                <div className="text-3xl font-bold text-green-600">✓ Ready</div>
                <div className="text-xs text-gray-500 mt-1">Computation Done</div>
              </div>
            </div>

            {Object.entries(result.co2_by_mode || {}).length > 0 && (
              <div>
                <h4 className="font-bold text-gray-900 mb-4">CO₂ by Transport Mode</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(result.co2_by_mode || {}).map(([mode, value]) => (
                    <div key={mode} className={`p-4 rounded-xl border-2 ${modeBgColors[mode] || 'bg-gray-50'}`}>
                      <div className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold text-white mb-2 ${modeColors[mode] || 'bg-gray-400'}`}>
                        {mode}
                      </div>
                      <div className="text-lg font-bold text-gray-900 mt-2">{Number(value).toFixed(2)} kg</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.warnings?.length > 0 && (
              <div className="mt-6 p-4 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
                <strong>⚠ Warnings:</strong> {result.warnings.join('; ')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Compute
