import React, { useState, useEffect } from "react";
import { TrendingUp, Truck, Anchor, Train, RefreshCw, BarChart3, Activity, Layers, ChevronRight } from "lucide-react";
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
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        .slide-in-right { animation: slideInRight 0.6s ease-out forwards; }
        .animate-pulse-subtle { animation: pulse-subtle 2s ease-in-out infinite; }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Header Section */}
        <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-gray-200/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="fade-in-up">
                <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                  Analytics Dashboard
                </h1>
                <p className="text-gray-600 mt-1 text-sm font-medium">Real-time supply chain sustainability insights</p>
              </div>

              <button
                onClick={fetchData}
                className="group flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 active:scale-95 slide-in-right"
              >
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                Refresh
              </button>
            </div>

           
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {error && <ErrorMessage message={error} />}

          {/* Hero KPI Cards Section */}
          {summary && (
            <section className="mb-16">
              <div className="mb-8 flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-emerald-600 rounded-full" />
                <h2 className="text-2xl font-bold text-gray-900">Key Performance Indicators</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "Total CO₂ Emissions", value: summary.total_co2, icon: TrendingUp, color: "bg-gradient-to-br from-red-500 to-orange-500", delay: 0 },
                  { title: "Total Units", value: summary.total_units, icon: Truck, color: "bg-gradient-to-br from-amber-500 to-yellow-500", delay: 0.1 },
                  { title: "Total Weight", value: summary.total_kg, icon: Anchor, color: "bg-gradient-to-br from-emerald-500 to-teal-500", delay: 0.2 },
                  { title: "Active Orders", value: summary.total_orders, icon: Train, color: "bg-gradient-to-br from-blue-500 to-cyan-500", delay: 0.3 },
                ].map((metric, i) => (
                  <div key={i} style={{ animationDelay: `${metric.delay}s` }} className="fade-in-up">
                    <SummaryCard
                      title={metric.title}
                      value={metric.value}
                      icon={metric.icon}
                      color={metric.color}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Charts & Analytics Section */}
          <section className="mb-16">
            <div className="mb-8 flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-emerald-600 to-cyan-600 rounded-full" />
              <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[
                { data: modeData, component: PieChartComponent, title: "Emissions by Transport Mode", colors: ["#ef4444", "#f59e0b", "#3b82f6", "#10b981"], delay: 0.1 },
                { data: monthData, component: BarChartComponent, title: "Monthly CO₂ Trend", colors: ["#3b82f6"], key: "CO2 Total", delay: 0.2 }
              ].map((cfg, idx) =>
                cfg.data && cfg.data.length > 0 ? (
                  <div 
                    key={idx} 
                    className="fade-in-up"
                    style={{ animationDelay: `${cfg.delay}s` }}
                  >
                    <cfg.component
                      data={cfg.data}
                      title={cfg.title}
                      colors={cfg.colors}
                      dataKey={cfg.key}
                    />
                  </div>
                ) : null
              )}
            </div>
          </section>

          {/* Warehouse Analysis */}
          {warehouseData.length > 0 && (
            <section className="mb-16">
              <div className="mb-8 flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-orange-600 to-red-600 rounded-full" />
                <h2 className="text-2xl font-bold text-gray-900">Warehouse Performance</h2>
              </div>

              <div className="fade-in-up" style={{ animationDelay: "0.3s" }}>
                <BarChartComponent
                  data={warehouseData}
                  title="Top Warehouses by CO₂ Emissions"
                  dataKey="CO2 Total"
                  colors={["#f97316"]}
                />
              </div>
            </section>
          )}

          {/* Recent Orders Section */}
          {orders.length > 0 && (
            <section className="mb-16">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-cyan-600 to-blue-600 rounded-full" />
                  <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
                </div>
                <Link 
                  to="/orders"
                  className="flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-700 transition-colors group"
                >
                  View All
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="fade-in-up" style={{ animationDelay: "0.4s" }}>
                <DataTable
                  data={orders}
                  columns={ordersColumns}
                  title=""
                />
              </div>
            </section>
          )}

          {/* CTA Section */}
          <section className="mb-8">
            <div className="relative rounded-2xl overflow-hidden p-12 bg-gradient-to-r from-blue-600 via-emerald-600 to-cyan-600 shadow-2xl fade-in-up" style={{ animationDelay: "0.5s" }}>
              <div className="absolute inset-0 opacity-10 bg-grid-pattern" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-white mb-3">Calculate Emissions</h3>
                  <p className="text-blue-100 text-lg">Get detailed CO₂ analysis for your shipments</p>
                </div>
                <Link
                  to="/compute"
                  className="flex-shrink-0 px-8 py-4 rounded-xl font-bold bg-white text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2 group"
                >
                  <BarChart3 className="w-5 h-5" />
                  Go to Calculator
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

export default Dashboard;
