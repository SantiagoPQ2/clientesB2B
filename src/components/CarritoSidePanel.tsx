import React, { useEffect, useState } from "react";
import { supabase } from "../config/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ChatBot from "./ChatBot";

interface Producto {
  id: string;
  articulo: string;
  nombre: string;
  marca: string;
  categoria: string;
  precio: number;
  stock: number;
  imagen_url?: string;
}

interface CarritoSidePanelProps {
  carrito: Record<string, number>;
  secondaryLabel: string;
  secondaryPath: string;
  primaryLabel?: string;
  onPrimaryClick?: () => void;
}

const CarritoSidePanel: React.FC<CarritoSidePanelProps> = ({
  carrito,
  secondaryLabel,
  secondaryPath,
  primaryLabel = "Ver carrito final",
  onPrimaryClick,
}) => {
  const { user } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarProductosCarrito = async () => {
      const catalogoCliente = String(user?.catalogo || "")
        .toUpperCase()
        .trim();

      const ids = Object.keys(carrito).filter(Boolean);

      if (!catalogoCliente) {
        setProductos([]);
        return;
      }

      if (ids.length === 0) {
        setProductos([]);
        return;
      }

      const { data, error } = await supabase
        .from("z_productos")
        .select("*")
        .eq("activo", true)
        .eq("catalogo", catalogoCliente)
        .gte("stock", 50)
        .in("id", ids);

      if (error) {
        console.error("Error cargando productos del carrito:", error);
        setProductos([]);
        return;
      }

      setProductos((data as Producto[]) || []);
    };

    cargarProductosCarrito();
  }, [carrito, user?.catalogo]);

  const totalItems = Object.values(carrito).reduce(
    (acc, v) => acc + (v || 0),
    0
  );

  const total = productos.reduce((acc, p) => {
    const qty = carrito[p.id] || 0;
    return acc + (p.precio || 0) * qty;
  }, 0);

  const handlePrimary = () => {
    if (onPrimaryClick) {
      onPrimaryClick();
    } else {
      navigate("/b2b/carrito");
    }
  };

  const handleSecondary = () => {
    navigate(secondaryPath);
  };

  return (
    <div className="w-full lg:w-[400px] xl:w-[430px] space-y-4 lg:sticky lg:top-20">
      {/* ================= CARRITO ================= */}
      <div className="bg-white rounded-xl shadow-md border p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Tu carrito
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          {totalItems === 0
            ? "Aún no agregaste productos."
            : `Tenés ${totalItems} ítem${totalItems > 1 ? "s" : ""} en el carrito.`}
        </p>

        <div className="max-h-56 overflow-y-auto mb-3 border rounded-lg">
          {totalItems === 0 ? (
            <div className="text-xs text-gray-400 text-center py-4">
              Agregá productos o promociones para verlos acá.
            </div>
          ) : (
            <ul className="divide-y">
              {productos.map((p) => {
                const qty = carrito[p.id] || 0;
                if (!qty) return null;

                const subtotal = (p.precio || 0) * qty;

                return (
                  <li key={p.id} className="px-3 py-2 text-xs">
                    <div className="flex justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 line-clamp-2">
                          {p.nombre}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {p.articulo} · x{qty}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          $
                          {subtotal.toLocaleString("es-AR", {
                            minimumFractionDigits: 0,
                          })}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700">Total</p>
          <p className="text-sm font-extrabold text-gray-900">
            ${total.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSecondary}
            className="flex-1 border rounded-lg py-2 text-sm font-semibold"
          >
            {secondaryLabel}
          </button>

          <button
            onClick={handlePrimary}
            className="flex-1 bg-gray-900 hover:bg-black text-white rounded-lg py-2 text-sm font-semibold"
          >
            {primaryLabel}
          </button>
        </div>
      </div>

      {/* ================= CHAT BOT ================= */}
      <ChatBot />
    </div>
  );
};

export default CarritoSidePanel;
