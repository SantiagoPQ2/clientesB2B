import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";

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
  onPrimaryClick?: () => void; // ⬅️ NECESARIO PARA EL MODAL
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
    if (onPrimaryClick) {
      onPrimaryClick(); // ⬅️ DISPARA EL MODAL
    } else {
      navigate("/b2b/carrito-final"); // fallback
    }
  };

  const handleSecondary = () => {
    navigate(secondaryPath);
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 w-full lg:w-[400px] xl:w-[430px] lg:sticky lg:top-20">
      <h3 className="text-base font-semibold text-gray-900 mb-1">
        Tu carrito
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        {totalItems === 0
          ? "Aún no agregaste productos."
          : `Tenés ${totalItems} ítem${totalItems > 1 ? "s" : ""} en el carrito.`}
      </p>

      <div className="max-h-56 overflow-y-auto mb-3 border border-gray-100 rounded-lg">
        {totalItems === 0 ? (
          <div className="text-xs text-gray-400 text-center py-4">
            Agregá productos o promociones para verlos acá.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
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
                        x{qty}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">
                        $
                        {subtotal.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
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

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 font-semibold">Total</span>
          <span className="text-lg font-bold text-red-600">
            $
            {total.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        {/* BOTÓN PRINCIPAL (MODAL O CARRITO) */}
        <button
          onClick={handlePrimary}
          disabled={totalItems === 0}
          className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition
            ${
              totalItems === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
        >
          {primaryLabel}
        </button>

        {/* BOTÓN SECUNDARIO */}
        <button
          onClick={handleSecondary}
          className="w-full inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
        >
          {secondaryLabel}
        </button>
      </div>
    </div>
  );
};

export default CarritoSidePanel;
