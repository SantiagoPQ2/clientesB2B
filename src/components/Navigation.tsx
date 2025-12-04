import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  Bell,
  User
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { supabase } from "../config/supabase";
import SearchBar from "./SearchBar";

const Navigation: React.FC = () => {
  const { user } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [notisAbiertas, setNotisAbiertas] = useState(false);

  // ============================
  // NOTIFICACIONES
  // ============================
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
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notificaciones" },
        () => cargarNotificaciones()
      )
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [user]);


  const sinLeer = notificaciones.filter((n) => !n.leida).length;

  return (
    <>
      <header className="w-full bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">

          {/* LEFT: Menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 hover:text-red-600"
          >
            <Menu size={24} />
          </button>

          {/* CENTER: SearchBar grande */}
          <div className="flex-1 flex justify-center px-4">
            <div className="w-full max-w-xl">
              <SearchBar />
            </div>
          </div>

          {/* RIGHT: Notifs + User */}
          <div className="flex items-center gap-4">

            {/* NOTIF */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotisAbiertas(!notisAbiertas);
                  if (!notisAbiertas) marcarLeidas();
                }}
                className="relative"
              >
                <Bell size={22} />
                {sinLeer > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
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
                        <li key={n.id} className="text-sm p-2 border-b">
                          <strong>{n.titulo}</strong>
                          <br />
                          {n.mensaje}
                          <br />
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

            {/* USER */}
            <div>
              <div className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold cursor-pointer">
                {user?.username?.[0]?.toUpperCase()}
              </div>
            </div>

          </div>

        </div>
      </header>

      {/* SIDEBAR */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setSidebarOpen(false)}
          ></div>

          <div className="fixed top-0 left-0 w-full max-w-xs sm:w-72 bg-white h-full shadow-xl z-50 p-4 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Menú</h2>

            <nav className="space-y-2">
              <Link to="/" className="block p-3 rounded-lg hover:bg-gray-100">Promociones</Link>
              <Link to="/b2b/catalogo" className="block p-3 rounded-lg hover:bg-gray-100">Catálogo</Link>
              <Link to="/b2b/carrito" className="block p-3 rounded-lg hover:bg-gray-100">Carrito</Link>
              <Link to="/b2b/pedidos" className="block p-3 rounded-lg hover:bg-gray-100">Pedidos</Link>
              <Link to="/info" className="block p-3 rounded-lg hover:bg-gray-100">Info</Link>
              <Link to="/settings" className="block p-3 rounded-lg hover:bg-gray-100">Configuración</Link>
            </nav>
          </div>
        </>
      )}
    </>
  );
};

export default Navigation;
