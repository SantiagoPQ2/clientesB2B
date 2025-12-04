import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  Bell,
  User,
  Settings as SettingsIcon,
  Store,
  ShoppingCart,
  Package
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useLocation, Link } from "react-router-dom";
import { supabase } from "../config/supabase";

// 🔎 Nuevo
import SearchBar from "./SearchBar";
import { useProductModal } from "../context/ProductModalContext";

const Navigation: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { openProductModal } = useProductModal(); // 🔎 importante

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [notisAbiertas, setNotisAbiertas] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú usuario al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cargar notificaciones
  const cargarNotificaciones = async () => {
    if (!user?.username) return;

    const { data } = await supabase
      .from("notificaciones")
      .select("*")
      .eq("usuario_username", user.username)
      .order("created_at", { ascending: false });

    if (data) setNotificaciones(data);
  };

  const marcarLeidas = async () => {
    if (!user?.username) return;

    await supabase
      .from("notificaciones")
      .update({ leida: true })
      .eq("usuario_username", user.username);

    cargarNotificaciones();
  };

  useEffect(() => {
    cargarNotificaciones();

    const sub = supabase
      .channel("notificaciones")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "notificaciones" },
        (payload) => {
          if (payload.new.usuario_username === user?.username) {
            cargarNotificaciones();
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [user]);

  const sinLeer = notificaciones.filter((n) => !n.leida).length;

  // Títulos
  const getCurrentPageName = () => {
    switch (location.pathname) {
      case "/": return "Promociones";
      case "/b2b/catalogo": return "Catálogo";
      case "/b2b/carrito": return "Carrito";
      case "/b2b/pedidos": return "Pedidos";
      case "/settings": return "Configuración";
      default: return "VaFood B2B";
    }
  };

  const menuItems = [
    { name: "Promociones", path: "/", icon: Store, description: "Promos disponibles" },
    { name: "Catálogo", path: "/b2b/catalogo", icon: Store, description: "Productos disponibles" },
    { name: "Carrito", path: "/b2b/carrito", icon: ShoppingCart, description: "Ver artículos agregados" },
    { name: "Pedidos", path: "/b2b/pedidos", icon: Package, description: "Historial de pedidos" },
    { name: "Configuración", path: "/settings", icon: SettingsIcon, description: "Preferencias del usuario" }
  ];

  return (
    <>
      <header className="w-full bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-2">

          {/* LEFT */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-600 hover:text-red-600 transition"
            >
              <Menu size={24} />
            </button>

            <div className="flex items-center">
              <img src="/image.png" className="h-8 w-8 mr-2" />
              <h1 className="text-lg font-semibold text-gray-800">
                {getCurrentPageName()}
              </h1>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4 relative">

            {/* 🔎 BUSCADOR GLOBAL */}
            <SearchBar  />

            {/* NOTIFICATIONS */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotisAbiertas(!notisAbiertas);
                  if (!notisAbiertas) marcarLeidas();
                }}
                className="relative p-2"
              >
                <Bell size={20} />
                {sinLeer > 0 && (
                  <span className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {sinLeer}
                  </span>
                )}
              </button>

              {notisAbiertas && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border p-3 z-50">
                  <h4 className="font-semibold mb-2">Notificaciones</h4>

                  {notificaciones.length === 0 ? (
                    <p className="text-sm text-gray-500">Sin notificaciones</p>
                  ) : (
                    <ul className="max-h-64 overflow-y-auto">
                      {notificaciones.map((n) => (
                        <li key={n.id} className="text-sm p-2 border-b border-gray-200">
                          <strong>{n.titulo}</strong><br />
                          {n.mensaje}<br />
                          <span className="text-xs text-gray-500">
                            {new Date(n.created_at).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* USER MENU */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-full bg-gray-100"
              >
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border p-2">
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

      {/* SIDEBAR */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSidebarOpen(false)}></div>

          <div className="fixed top-0 left-0 w-full max-w-xs sm:w-72 bg-white h-full shadow-xl z-50 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Menú</h2>
              <button className="text-gray-600 hover:text-red-600" onClick={() => setSidebarOpen(false)}>
                <Menu size={22} />
              </button>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      isActive ? "bg-red-50 border-l-4 border-red-500" : "hover:bg-gray-50"
                    }`}
                  >
                    <Icon className={`h-5 w-5 mt-0.5 ${isActive ? "text-red-600" : "text-gray-500"}`} />
                    <div>
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
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
