import React, { useEffect, useState } from "react";
import { supabase } from "../config/supabase";
import { useNavigate } from "react-router-dom";
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
  const [productos, setProductos] = useState<Producto[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarProductosCarrito = async () => {
      const ids = Object.keys(carrito).filter(Boolean);
      if (ids.length === 0) {
        setProductos([]);
        return;
      }

      const { data, error } = await supabase
        .from("z_productos")
        .select("*")
        .in("id", ids);

      if (error) {
        console.error("Error cargando productos del carrito:", error);
        setProductos([]);
        return;
      }

      setProductos((data as Producto[]) || []);
    };

    cargarProductosCarrito();
  }, [carrito]);

  const totalItems = Object.values(carrito).reduce(
    (acc, v) => acc + (v || 0),
    0
  );

  const total = productos.reduce((acc, p) => {
    const qty = carrito[p.id] || 0;
    return acc + (p.precio || 0) * qty;
  }, 0);

  const handlePrimary = () => {
    if (onPrimaryClick) onPrimaryClick();
    else navigate("/b2b/carrito");
  };

  const handleSecondary = () => {
    navigate(secondaryPath);
  };

  return (
    <div className="w-full lg:w-[400px] xl:w-[430px] space-y-4 lg:sticky lg:top-20">
      {/* ================= CARRITO ================= */}
      <div className="bg-white rounded-2xl vafood-shadow border border-gray-100 p-4 animate-fadeIn">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-gray-900">Tu carrito</h3>
          <div className="text-[11px] px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 font-bold">
            {totalItems} ítem{totalItems === 1 ? "" : "s"}
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-1 mb-3">
          {totalItems === 0
            ? "Aún no agregaste productos."
            : "Revisá cantidades y finalizá cuando quieras."}
        </p>

        <div className="max-h-56 overflow-y-auto mb-3 border border-gray-100 rounded-xl">
          {totalItems === 0 ? (
            <div className="text-xs text-gray-400 text-center py-5">
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
                        <p className="text-[11px] text-gray-500">
                          {p.articulo} · x{qty}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        $
                        {subtotal.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 font-semibold">Total</span>
          <span className="text-lg font-extrabold text-red-600">
            $
            {total.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <button
            onClick={handlePrimary}
            disabled={totalItems === 0}
            className={`w-full px-4 py-2 rounded-xl text-sm font-extrabold shadow-sm transition
              ${
                totalItems === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "vafood-gradient hover:opacity-[0.96] text-white"
              }`}
          >
            {primaryLabel}
          </button>

          <button
            onClick={handleSecondary}
            className="w-full px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
          >
            {secondaryLabel}
          </button>

          <div className="mt-1 text-[11px] text-gray-500">
            Comprando online tenés <b className="text-red-600">12% OFF</b>.
          </div>
        </div>
      </div>

      {/* ================= CHAT IA ================= */}
      <ChatBot />
    </div>
  );
};

export default CarritoSidePanel;
