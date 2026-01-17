import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./Dashboard";
import Orders from "./Orders";
import Compute from "./Compute";
import "./index.css";
import logo from "../assets/log.png";

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
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-[95%] 2xl:max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <NavLink to="/" className="group">
              <div className="relative rounded-2xl p-1 bg-gradient-to-br from-emerald-100 via-slate-100 to-cyan-100 border border-emerald-100/70 shadow-sm">
                <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.12),transparent_30%)]" aria-hidden="true" />
                <img 
                  src={logo} 
                  alt="Supply Chain CO₂" 
                  className="relative h-26 w-40 object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </NavLink>

            {/* Center Text */}
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                Supply Chain CO₂
              </div>
              <div className="text-lg text-gray-500 font-medium">Sustainability Platform</div>
            </div>

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
