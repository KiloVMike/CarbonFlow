import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./Dashboard";
import Orders from "./Orders";
import Compute from "./Compute";
import "./index.css";

/* Modern Nav Item */
const NavItem = ({ to, label, icon }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2
       ${
         isActive
           ? "text-white bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30"
           : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
       }`
    }
  >
    {icon && <span className="text-lg">{icon}</span>}
    {label}
  </NavLink>
);

function App() {
  return (
    <BrowserRouter>
      {/* Navbar */}
      <header className="sticky top-2 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[95%] 2xl:max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <NavLink
              to="/"
              className="flex items-center gap-3 group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative p-2.5 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-xl">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                  Supply Chain CO₂
                </div>
                <div className="text-xs text-gray-500 font-medium">Emissions Tracking Platform</div>
              </div>
            </NavLink>

            {/* Navigation */}
            <nav className="flex items-center gap-3">
              <NavItem to="/" label="Dashboard" icon="📊" />
              <NavItem to="/orders" label="Orders" icon="📦" />
              <NavItem to="/compute" label="Compute" icon="⚡" />
            </nav>
          </div>
        </div>
      </header>

      {/* Routes */}
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/compute" element={<Compute />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
