import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navigation() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path ? "text-red-600 font-bold" : "text-gray-700";

  return (
    <header className="w-full bg-white shadow px-4 py-3 flex items-center justify-between">
      {/* Logo + rol */}
      <div>
        <h1 className="text-xl font-semibold">VaFood B2B</h1>
        <p className="text-xs text-gray-500">
          Rol: <strong>{user?.role}</strong>
        </p>
      </div>

      {/* Navigation links */}
      <nav className="flex gap-6 items-center">

        <Link to="/catalogo" className={isActive("/catalogo")}>
          Catálogo
        </Link>

        <Link to="/carrito" className={isActive("/carrito")}>
          Carrito
        </Link>

        <Link to="/pedidos" className={isActive("/pedidos")}>
          Pedidos
        </Link>

        <Link to="/settings" className={isActive("/settings")}>
          Settings
        </Link>

        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
        >
          Salir
        </button>
      </nav>
    </header>
  );
}
