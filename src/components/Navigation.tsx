import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  Bell,
  User,
  Settings as SettingsIcon,
  ShoppingCart,
  Package,
  Info
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useLocation, Link } from "react-router-dom";
import SearchBar from "./SearchBar"; // ⭐ NUEVO BUSCADOR CENTRAL

const Navigation: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // ============================
  // Cerrar menú usuario al click afuera
  // ============================
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ============================
  // ITEMS DEL MENÚ LATERAL
  // ============================
  const menuItems = [
    { name: "Promociones", path: "/", icon: Package },
    { name: "Catálogo", path: "/b2b/catalogo", icon: Package },
    { name: "Carrito", path: "/b2b/carrito", icon: ShoppingCart },
    { name: "Pedidos", path: "/b2b/pedidos", icon: Package },
    { name: "Información", path: "/info", icon: Info }, // ⭐ NUEVA PESTAÑA
    { name: "Configuración", path: "/settings", icon: SettingsIcon }
  ];

  return (
    <>
      {/* =========================================== */}
      {/*                TOP NAVBAR                   */}
      {/* =========================================== */}
      <header className="w-full bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-2">

          {/* LEFT – Botón menú */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-600 hover:text-red-600 transition"
            >
              <Menu size={24} />
            </button>

            {/* Logo */}
            <img src="/image.png" className="h-8 w-8" />
          </div>

          {/* CENTER – Buscador grande estilo Coto ⭐ */}
          <div className="flex-1 flex justify-center px-4">
            <div className="w-full max-w-xl">
              <SearchBar />
            </div>
          </div>

          {/* RIGHT – Notificaciones + Usuario */}
          <div className="flex items-center gap-4 relative">

            {/* NOTIFICATIONS */}
            <button className="relative p-2 text-gray-600 hover:text-red-600">
              <Bell size={20} />
            </button>

            {/* USER MENU */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-full bg-gray-100"
              >
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
                  <p className="px-4 py-2 text-sm border-b">{user?.username}</p>

                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => (window.location.href = "/settings")}
                  >
                    <User size={16} /> Configuración
                  </button>

                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      localStorage.clear();
                      window.location.href = "/";
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* =========================================== */}
      {/*                 SIDEBAR LEFT                */}
      {/* =========================================== */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setSidebarOpen(false)}
          ></div>

          <div className="fixed top-0 left-0 w-full max-w-xs bg-white h-full shadow-xl z-50 p-4 overflow-y-auto">

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Menú</h2>
              <button
                className="text-gray-600 hover:text-red-600"
                onClick={() => setSidebarOpen(false)}
              >
                <Menu size={22} />
              </button>
            </div>

            {/* LISTA DE ITEMS */}
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-lg transition ${
                      active
                        ? "bg-red-50 border-l-4 border-red-500 text-red-600"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={20} className={active ? "text-red-600" : "text-gray-500"} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

          </div>
        </>
      )}
    </>
  );
};

export default Navigation;

