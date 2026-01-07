import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./Dashboard";
import Orders from "./Orders";
import Compute from "./Compute";
import "./index.css";

/* Modern Nav Item */
const NavItem = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300
       ${
         isActive
           ? "text-blue-600 bg-blue-50"
           : "text-gray-700 hover:text-blue-600 hover:bg-gray-100"
       }`
    }
  >
    {label}
  </NavLink>
);

function App() {
  return (
    <BrowserRouter>
      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          {/* Logo */}
          <NavLink
            to="/"
            className="text-xl font-extrabold tracking-tight 
                       bg-gradient-to-r from-blue-600 to-emerald-500 
                       bg-clip-text text-transparent
                       hover:scale-105 transition-transform duration-300"
          >
            Supply Chain CO₂
          </NavLink>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            <NavItem to="/" label="Dashboard" />
            <NavItem to="/orders" label="All Orders" />
            <NavItem to="/compute" label="Compute" />
          </nav>
        </div>
      </header>

      {/* Routes */}
      <main className="max-w-7xl mx-auto px-6 py-6">
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
