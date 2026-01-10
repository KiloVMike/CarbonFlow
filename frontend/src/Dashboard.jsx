import React, { useState, useEffect } from "react";
import { TrendingUp, Truck, Anchor, Train } from "lucide-react";
import { Link } from "react-router-dom";
import api from "./api";
import {
  SummaryCard,
  BarChartComponent,
  PieChartComponent,
  DataTable,
  LoadingSpinner,
  ErrorMessage,
} from "./components";

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [byMode, setByMode] = useState({});
  const [byWarehouse, setByWarehouse] = useState([]);
  const [byMonth, setByMonth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, ordersRes, , warehouseRes, monthRes] =
        await Promise.all([
          api.getSummary(),
          api.getOrders(1, 5),
          api.getAnalyticsByMode(),
          api.getAnalyticsByWarehouse(),
          api.getAnalyticsByMonth(),
        ]);

      setSummary(summaryRes.data);
      setOrders(ordersRes.data?.orders || []);
      setByMode(summaryRes.data?.co2_by_mode || {});
      setByWarehouse(warehouseRes.data || []);
      setByMonth(monthRes.data || []);
    } catch (err) {
      setError(err.message || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const modeData = Object.entries(byMode || {}).map(([name, value]) => ({
    name,
    value: Number(value) || 0,
  }));

  const monthData = byMonth.map((m) => ({
    name: m.month,
    "CO2 Total": Number(m.total_co2) || 0,
  }));

  const warehouseData = byWarehouse
    .map((w) => ({
      name: w.warehouse_code,
      "CO2 Total": Number(w.total_co2) || 0,
    }))
    .slice(0, 5);

  const ordersColumns = [
    { key: "Order Number", label: "Order" },
    { key: "Customer Country", label: "Country" },
    { key: "Delivery Mode", label: "Mode" },
    {
      key: "CO2 Total",
      label: "CO₂ (kg)",
      render: (val) =>
        typeof val === "number" ? val.toFixed(2) : "N/A",
    },
  ];

  const modeColors = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981"];

  return (
    <>
      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }

        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes slowPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>

      <div
        className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50"
      >
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CO₂ Emissions Dashboard</h1>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400" style={{ animation: "slowPulse 2s infinite" }} />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Live monitoring
              </div>
            </div>

            <Link
              to="/orders"
              className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
            >
              View Orders
            </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
          {error && <ErrorMessage message={error} />}

          {/* KPIs */}
          {summary && (
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[TrendingUp, Truck, Anchor, Train].map((Icon, i) => (
                  <SummaryCard
                    key={i}
                    title={["Total CO₂", "Total Units", "Total Weight", "Orders"][i]}
                    value={[summary.total_co2, summary.total_units, summary.total_kg, summary.total_orders][i]}
                    icon={Icon}
                    color={[
                      "bg-gradient-to-br from-red-500 to-red-600",
                      "bg-gradient-to-br from-amber-500 to-amber-600",
                      "bg-gradient-to-br from-green-500 to-green-600",
                      "bg-gradient-to-br from-purple-500 to-purple-600",
                    ][i]}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Charts */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[ 
              { data: modeData, component: PieChartComponent, title: "Emissions by Mode", colors: modeColors },
              { data: monthData, component: BarChartComponent, title: "Monthly CO₂ Trend", colors: ["#3b82f6"], key: "CO2 Total" }
            ].map((cfg, idx) =>
              cfg.data.length > 0 ? (
                <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <cfg.component
                    data={cfg.data}
                    title={cfg.title}
                    colors={cfg.colors}
                    dataKey={cfg.key}
                  />
                </div>
              ) : null
            )}
          </section>

          {/* Warehouse Chart */}
          {warehouseData.length > 0 && (
            <section>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <BarChartComponent
                  data={warehouseData}
                  title="Top Warehouses by CO₂ Emissions"
                  dataKey="CO2 Total"
                  colors={["#ef4444"]}
                />
              </div>
            </section>
          )}

          {/* Orders */}
          {orders.length > 0 && (
            <section>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <DataTable
                  data={orders}
                  columns={ordersColumns}
                  title="Recent Orders"
                />
              </div>
            </section>
          )}

          {/* Refresh */}
          <div className="flex justify-center pt-4">
            <button
              onClick={fetchData}
              className="px-8 py-2.5 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
            >
              <span>↻</span>
              Refresh Data
            </button>
          </div>
        </main>
      </div>
    </>
  );
}

export default Dashboard;
