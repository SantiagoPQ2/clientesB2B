import React, { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import { useNavigate } from "react-router-dom";
import CarritoSidePanel from "../../components/CarritoSidePanel";

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

  const cargarPromos = async () => {
    const { data, error } = await supabase
      .from("z_productos")
      .select("*")
      .not("combo", "is", null)
      .ilike("combo", "%combo%");

    if (error) {
      console.error("Error cargando promos:", error);
      return;
    }

    setPromos((data as Producto[]) || []);
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
    <div className="w-full">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* PROMOS */}
          <div className="lg:col-span-3">
            {promos.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500">
                No hay promociones disponibles en este momento.
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {promos.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-xl border shadow-md hover:shadow-lg transition overflow-hidden flex flex-col"
                  >
                    {/* Imagen */}
                    <div className="h-40 bg-gray-50 flex items-center justify-center">
                      {p.imagen_url ? (
                        <img
                          src={p.imagen_url}
                          alt={p.nombre}
                          className="max-h-full object-contain"
                        />
                      ) : (
                        <div className="text-gray-400 text-xs text-center px-2">
                          Sin imagen <br /> {p.articulo}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-1">
                      <div className="mb-2">
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-md">
                          PROMO
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-gray-900 line-clamp-2">
                        {p.nombre}
                      </h3>

                      <p className="text-xs text-gray-500 mt-1 mb-3">
                        {p.marca} • {p.categoria}
                      </p>

                      <div className="flex items-center justify-between mt-auto">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase">
                            Precio promo
                          </p>
                          <p className="text-lg font-bold text-red-600">
                            $
                            {(p.precio ?? 0).toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>

                        <button
                          disabled={p.stock <= 0}
                          onClick={() => agregar(p.id)}
                          className={`
                            px-3 py-2 rounded-lg text-xs font-semibold transition shadow
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
                ))}
              </div>
            )}
          </div>

          {/* CARRITO LATERAL */}
          <div className="lg:col-span-1 lg:pl-4 xl:pl-10">
            <CarritoSidePanel
              carrito={carrito}
              secondaryLabel="Ver catálogo"
              secondaryPath="/b2b/catalogo"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromosB2B;
