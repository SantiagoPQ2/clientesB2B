import React, { useEffect, useState } from "react";
import { supabase } from "../config/supabase";
import { useNavigate } from "react-router-dom";

interface ItemCarrito {
  id: string;
  cantidad: number;
}

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  imagen_url?: string;
  articulo: string;
}

const CarritoSidePanel = ({ carrito }: { carrito: Record<string, number> }) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    cargarProductos();
  }, [carrito]);

  const cargarProductos = async () => {
    const ids = Object.keys(carrito);
    if (ids.length === 0) return setProductos([]);

    const { data } = await supabase
      .from("z_productos")
      .select("*")
      .in("id", ids);

    setProductos((data as Producto[]) || []);
  };

  const total = productos.reduce(
    (acc, p) => acc + p.precio * (carrito[p.id] || 0),
    0
  );

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 w-full lg:w-[350px] xl:w-[380px] sticky top-10 h-fit">

      <h3 className="font-semibold text-lg mb-1">Tu carrito</h3>
      <p className="text-sm text-gray-500 mb-4">
        Tenés {Object.values(carrito).reduce((a, b) => a + b, 0)} ítems en el carrito.
      </p>

      <div className="max-h-72 overflow-y-auto space-y-3 pr-1">

        {productos.map((p) => (
          <div
            key={p.id}
            className="border-b pb-2 flex justify-between items-start"
          >
            <div className="flex flex-col">
              <p className="text-sm font-semibold">{p.nombre}</p>
              <p className="text-[11px] text-gray-500">
                x{carrito[p.id]}
              </p>
            </div>

            <p className="text-sm font-semibold text-gray-700">
              $
              {(p.precio * carrito[p.id]).toLocaleString("es-AR")}
            </p>
          </div>
        ))}

      </div>

      <div className="mt-4 border-t pt-3 flex justify-between items-center">
        <p className="font-semibold text-gray-800">Total</p>
        <p className="font-bold text-red-600 text-lg">
          ${total.toLocaleString("es-AR")}
        </p>
      </div>

      <button
        onClick={() => navigate("/b2b/carrito")}
        className="mt-4 w-full py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
      >
        Ver carrito final
      </button>

      <button
        onClick={() => navigate("/b2b/catalogo")}
        className="mt-2 w-full py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg"
      >
        Ver catálogo
      </button>
    </div>
  );
};

export default CarritoSidePanel;

