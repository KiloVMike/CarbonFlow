import React, { useState } from 'react'

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

  const addItem = () => {
    setItems([...items, { id: Date.now(), code: '', units: '' }])
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
    setTransports(copy)
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

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Compute Emissions</h2>

      {/* Basic Info */}
      <div className="bg-white border rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-lg">Route Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Warehouse Code</label>
            <input
              value={warehouse}
              onChange={e => setWarehouse(e.target.value)}
              className="mt-1 w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Customer Code</label>
            <input
              value={customer}
              onChange={e => setCustomer(e.target.value)}
              className="mt-1 w-full border rounded p-2"
            />
          </div>

        </div>
      </div>

      {/* Items */}
      <div className="bg-white border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-lg">Items</h3>

        {items.map((it, idx) => (
          <div key={it.id} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              placeholder="Item Code"
              value={it.code}
              onChange={e => updateItem(idx, 'code', e.target.value)}
              className="border rounded p-2"
            />
            <input
              placeholder="Units"
              value={it.units}
              onChange={e => updateItem(idx, 'units', e.target.value)}
              className="border rounded p-2"
            />
          </div>
        ))}

        <button
          onClick={addItem}
          className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
        >
          + Add Item
        </button>
      </div>

      {/* Transport Legs */}
      <div className="bg-white border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-lg">Transport Legs</h3>

        {transports.map((t, idx) => (
          <div key={t.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
            <select
              value={t.mode}
              onChange={e => updateTransport(idx, 'mode', e.target.value)}
              className="border rounded p-2"
            >
              <option value="Road">Road</option>
              <option value="Rail">Rail</option>
              <option value="Sea">Sea</option>
              <option value="Air">Air</option>
            </select>

            <input
              placeholder="Distance km"
              value={t.distance}
              onChange={e => updateTransport(idx, 'distance', e.target.value)}
              className="border rounded p-2"
            />

            <button
              onClick={() => removeTransport(idx)}
              className="text-sm px-3 py-1 border rounded text-red-600 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        ))}

        <button
          onClick={addTransport}
          className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
        >
          + Add Transport Leg
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={submit}
          disabled={loading}
          className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Computing…' : 'Compute Emissions'}
        </button>
      </div>

      {/* Errors */}
      {error && (
        <div className="p-3 border border-red-300 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-lg">Results</h3>

          <div><strong>Total KG:</strong> {result.total_kg}</div>
          <div><strong>Total CO₂:</strong> {result.total_co2}</div>

          <div>
            <strong>By Mode:</strong>
            <ul className="list-disc ml-6">
              {Object.entries(result.co2_by_mode || {}).map(([m, v]) => (
                <li key={m}>{m}: {v}</li>
              ))}
            </ul>
          </div>

          {result.warnings?.length > 0 && (
            <div className="text-yellow-700">
              <strong>Warnings:</strong> {result.warnings.join('; ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Compute
