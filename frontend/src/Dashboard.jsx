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
      {/* 🔥 INLINE MOTION ENGINE — NO CSS FILE */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes slowPulse {
          0% { opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { opacity: 0.4; }
        }
      `}</style>

      <div
        className="min-h-screen relative overflow-hidden"
        style={{
          background:
            "linear-gradient(-45deg, #f8fafc, #eef2f7, #f1f5f9, #e2e8f0)",
          backgroundSize: "400% 400%",
          animation: "gradientMove 20s ease infinite",
        }}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 backdrop-blur bg-white/60 border-b">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                CO₂ Emissions Dashboard
              </h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400"
                        style={{ animation: "slowPulse 2s infinite" }} />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                Live visual monitoring
              </div>
            </div>

            <Link
              to="/orders"
              className="px-4 py-2 rounded-lg text-sm font-medium
                         bg-gray-900 text-white hover:bg-gray-800 transition"
            >
              View Orders
            </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
          {error && <ErrorMessage message={error} />}

          {/* KPIs */}
          {summary && (
            <section className="relative">
              <div
                className="absolute inset-0 blur-3xl rounded-3xl"
                style={{
                  background:
                    "linear-gradient(90deg, #60a5fa, #34d399, #a78bfa)",
                  animation: "slowPulse 4s infinite",
                }}
              />
              <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[TrendingUp, Truck, Anchor, Train].map((Icon, i) => (
                  <div
                    key={i}
                    style={{ animation: "float 6s ease-in-out infinite" }}
                  >
                    <SummaryCard
                      title={
                        ["Total CO₂", "Total Units", "Total Weight", "Orders"][i]
                      }
                      value={[
                        summary.total_co2,
                        summary.total_units,
                        summary.total_kg,
                        summary.total_orders,
                      ][i]}
                      icon={Icon}
                      color={[
                        "bg-gradient-to-br from-blue-500 to-blue-600",
                        "bg-gradient-to-br from-orange-500 to-orange-600",
                        "bg-gradient-to-br from-green-500 to-green-600",
                        "bg-gradient-to-br from-purple-500 to-purple-600",
                      ][i]}
                    />
                  </div>
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
                <div
                  key={idx}
                  className="relative bg-white/80 backdrop-blur border rounded-2xl p-6 shadow-sm overflow-hidden"
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    style={{ animation: "shimmer 8s linear infinite" }}
                  />
                  <div className="relative">
                    <cfg.component
                      data={cfg.data}
                      title={cfg.title}
                      colors={cfg.colors}
                      dataKey={cfg.key}
                    />
                  </div>
                </div>
              ) : null
            )}
          </section>

          {/* Warehouse Chart */}
        {warehouseData.length > 0 && (
          <div className="mb-8">
            <BarChartComponent
              data={warehouseData}
              title="Top Warehouses by CO₂ Emissions"
              dataKey="CO2 Total"
              colors={["#ef4444"]}
            />
          </div>
        )}


          {/* Orders */}
          {orders.length > 0 && (
            <section
              className="bg-white/80 backdrop-blur border rounded-2xl p-6 shadow-sm"
              style={{ animation: "float 10s ease-in-out infinite" }}
            >
              <DataTable
                data={orders}
                columns={ordersColumns}
                title="Recent Orders"
              />
            </section>
          )}
          {/* Refresh */}
          <div className="flex justify-center">
            <button
              onClick={fetchData}
              className="group px-8 py-2.5 rounded-xl font-medium
                         bg-gradient-to-r from-blue-600 to-blue-500
                         text-white shadow hover:shadow-lg
                         hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              <span className="group-hover:rotate-180 transition-transform duration-700">
                ↻
              </span>
              Refresh Data
            </button>
          </div>
        </main>
      </div>
    </>
  );
}

export default Dashboard;
