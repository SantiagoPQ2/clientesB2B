import React, { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import { useNavigate } from "react-router-dom";
import CarritoSide from "../../components/CarritoSidePanel";

interface Producto {
  id: string;
  articulo: string;
  nombre: string;
  marca: string;
  categoria: string;
  precio: number;
  stock: number;
  imagen_url?: string;
  combo?: string | null;
}

const PromosB2B: React.FC = () => {
  const [promos, setPromos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<Record<string, number>>({});
  const [anim, setAnim] = useState<Record<string, boolean>>({});

  const navigate = useNavigate();

  useEffect(() => {
    cargarPromos();
    cargarCarrito();
  }, []);

  const cargarCarrito = () => {
    const data = localStorage.getItem("carrito_b2b");
    if (data) setCarrito(JSON.parse(data));
  };

  const guardarCarrito = (nuevo: Record<string, number>) => {
    setCarrito(nuevo);
    localStorage.setItem("carrito_b2b", JSON.stringify(nuevo));
  };

  // 🔥 TRAER SOLO LOS PRODUCTOS QUE SON PROMOS
  const cargarPromos = async () => {
    const { data, error } = await supabase
      .from("z_productos")
      .select("*")
      .not("combo", "is", null)
      .ilike("combo", "%combo%");

    if (error) console.error("Error cargando promos:", error);
    if (data) setPromos(data);
  };

  const agregar = (id: string) => {
    setAnim((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setAnim((prev) => ({ ...prev, [id]: false }));
    }, 300);

    const nuevo = { ...carrito, [id]: (carrito[id] || 0) + 1 };
    guardarCarrito(nuevo);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-6">

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        
        {/* ============================ */}
        {/*      GRID DE PROMOCIONES     */}
        {/* ============================ */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">

            {promos.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500 col-span-2">
                No hay promociones disponibles en este momento.
              </div>
            ) : (
              promos.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl transition"
                >
                  {/* Imagen */}
                  <div className="h-56 bg-gray-50 flex items-center justify-center">
                    {p.imagen_url ? (
                      <img
                        src={p.imagen_url}
                        alt={p.nombre}
                        className="max-h-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-gray-400 text-xs">
                        Sin imagen<br />{p.articulo}
                      </div>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="p-5 flex flex-col h-44">

                    <span className="px-2 py-1 bg-red-100 text-red-700 text-[11px] font-bold rounded-md w-fit mb-1">
                      PROMO
                    </span>

                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                      {p.nombre}
                    </h3>

                    <div className="mt-auto flex items-center justify-between">
                      <p className="text-xl font-bold text-red-600">
                        $
                        {(p.precio ?? 0).toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>

                      <button
                        disabled={p.stock <= 0}
                        onClick={() => agregar(p.id)}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-semibold transition shadow
                          ${
                            p.stock <= 0
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : anim[p.id]
                              ? "bg-gray-300 text-gray-700 scale-105"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }
                        `}
                      >
                        {anim[p.id] ? "Añadido ✔" : "Agregar"}
                      </button>
                    </div>

                  </div>
                </div>
              ))
            )}

          </div>
        </div>

        {/* ============================ */}
        {/*         CARRITO LATERAL      */}
        {/* ============================ */}
        <CarritoSide carrito={carrito} />

      </div>
    </div>
  );
};

export default PromosB2B;
