import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const NavigationB2B: React.FC = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const location = useLocation();

  const count = cart.reduce((acc, x) => acc + x.cantidad, 0);

  const nav = [
    { name: "Promos", path: "/b2b/promos" },
    { name: "Catálogo", path: "/b2b/catalogo" },
    { name: "Carrito", path: "/b2b/carrito" },
    { name: "Pedidos", path: "/b2b/pedidos" },
    { name: "Settings", path: "/b2b/settings" },
  ];

  return (
    <header className="w-full bg-white shadow-sm border-b border-gray-100 p-3 flex justify-between items-center">
      <div className="font-bold text-lg">
        VaFood B2B
        <div className="text-xs font-normal">Rol: {user?.role}</div>
      </div>

      <nav className="flex gap-5">
        {nav.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`${
              location.pathname === item.path ? "text-red-600 font-semibold" : ""
            }`}
          >
            {item.name}
            {item.name === "Carrito" && count > 0 && (
              <span className="ml-1 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                {count}
              </span>
            )}
          </Link>
        ))}

        <button
          onClick={logout}
          className="ml-4 px-3 py-1 bg-red-700 text-white rounded"
        >
          Salir
        </button>
      </nav>
    </header>
  );
};

export default NavigationB2B;
