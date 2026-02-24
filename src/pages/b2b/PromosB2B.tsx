import React, { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import { useNavigate } from "react-router-dom";
import CarritoSidePanel from "../../components/CarritoSidePanel";
import { useAuth } from "../../context/AuthContext";
import ProductoModal from "../../components/ProductoModal";

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
  const { user } = useAuth();
  const navigate = useNavigate();

  const [promos, setPromos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<Record<string, number>>({});
  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);

  useEffect(() => {
    const data = localStorage.getItem("carrito_b2b");
    if (data) setCarrito(JSON.parse(data));
  }, []);

  const guardarCarrito = (nuevo: Record<string, number>) => {
    setCarrito(nuevo);
    localStorage.setItem("carrito_b2b", JSON.stringify(nuevo));
  };

  useEffect(() => {
    const cargar = async () => {
      const catalogoCliente = String(user?.catalogo || "").toUpperCase().trim();
      if (!catalogoCliente) {
        setPromos([]);
        return;
      }

      const { data, error } = await supabase
        .from("z_productos")
        .select("*")
        .eq("activo", true)
        .ilike("catalogo", catalogoCliente)
        .gte("stock", 50)
        .not("combo", "is", null)
        .ilike("combo", "%combo%");

      if (error) {
        console.error("Error cargando promos:", error);
        setPromos([]);
        return;
      }

      setPromos((data as Producto[]) || []);
    };

    cargar();
  }, [user?.catalogo]);

  const cambiarCantidad = (id: string, cantidad: number, stock: number) => {
    const nueva = Math.max(0, Math.min(Math.floor(cantidad || 0), stock));
    if (nueva <= 0) {
      const copia = { ...carrito };
      delete copia[id];
      guardarCarrito(copia);
    } else {
      guardarCarrito({ ...carrito, [id]: nueva });
    }
  };

  const agregarUno = (id: string, stock: number) => {
    const actual = carrito[id] || 0;
    cambiarCantidad(id, actual + 1, stock);
  };

  return (
    <div className="w-full">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* LISTADO */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl vafood-shadow border border-gray-100 p-5 animate-fadeIn">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">
                    Promociones
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Solo promos disponibles para tu catálogo y con stock.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/b2b/catalogo")}
                  className="text-sm font-bold text-red-600 hover:text-red-700 transition"
                >
                  Ver catálogo →
                </button>
              </div>
            </div>

            {promos.length === 0 ? (
              <div className="bg-white rounded-2xl vafood-shadow border border-gray-100 p-8 text-center text-gray-500 animate-fadeIn">
                No hay promociones disponibles en este momento.
              </div>
            ) : (
              <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {promos.map((p) => {
                  const qty = carrito[p.id] || 0;
                  const maxed = qty >= p.stock;

                  return (
                    <div
                      key={p.id}
                      className="group bg-white rounded-2xl vafood-shadow border border-gray-100 flex flex-col
                                 hover:shadow-xl hover:border-red-500/50 transition-all duration-200
                                 hover:-translate-y-0.5 cursor-pointer animate-fadeIn"
                      onClick={() => setProductoSeleccionado(p)}
                    >
                      <div className="relative h-44 bg-gray-50 flex items-center justify-center overflow-hidden rounded-t-2xl">
                        <div className="absolute top-3 left-3 text-[11px] font-extrabold px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-100">
                          PROMO
                        </div>

                        {p.imagen_url ? (
                          <img
                            src={p.imagen_url}
                            alt={p.nombre}
                            className="max-h-full object-contain transition-transform duration-200 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="text-xs text-gray-400 text-center px-3">
                            Sin imagen
                            <div className="mt-1 text-[11px]">{p.articulo}</div>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col p-4">
                        <h3 className="text-base font-extrabold text-gray-900 line-clamp-2">
                          {p.nombre}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Código {p.articulo} · Stock {p.stock}
                        </p>

                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-xl font-extrabold text-red-600">
                            $
                            {p.precio.toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          <span className="text-[11px] text-gray-500">
                            12% OFF online
                          </span>
                        </div>

                        <div
                          className="mt-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {qty === 0 ? (
                            <button
                              onClick={() => agregarUno(p.id, p.stock)}
                              className="w-full vafood-gradient hover:opacity-[0.96] text-white rounded-xl py-2.5 text-sm font-extrabold shadow-sm transition"
                            >
                              Agregar
                            </button>
                          ) : (
                            <div className="w-full inline-flex items-center justify-between rounded-xl border border-gray-200 overflow-hidden">
                              <button
                                onClick={() =>
                                  cambiarCantidad(p.id, qty - 1, p.stock)
                                }
                                className="w-12 py-2 text-sm font-extrabold hover:bg-gray-50 transition"
                              >
                                −
                              </button>

                              <span className="px-3 text-sm font-extrabold text-gray-900">
                                {qty}
                              </span>

                              <button
                                disabled={maxed}
                                onClick={() => agregarUno(p.id, p.stock)}
                                className={`w-12 py-2 text-sm font-extrabold transition ${
                                  maxed
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "hover:bg-red-50 text-red-700"
                                }`}
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>

                        <p className="mt-3 text-[11px] text-gray-500">
                          Aprovechá promos + envío 48h.
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CARRITO */}
          <CarritoSidePanel
            carrito={carrito}
            secondaryLabel="Ir al catálogo"
            secondaryPath="/b2b/catalogo"
            primaryLabel="Ver carrito final"
            onPrimaryClick={() => navigate("/b2b/carrito")}
          />
        </div>
      </div>

      {/* MODAL PRODUCTO (si tu ProductoModal ya existe y lo usás en catálogo, lo reutilizamos) */}
      {productoSeleccionado && (
        <ProductoModal
          producto={productoSeleccionado}
          cantidadInicial={carrito[productoSeleccionado.id] || 0}
          onClose={() => setProductoSeleccionado(null)}
          onConfirm={(cantidad) =>
            guardarCarrito({
              ...carrito,
              [productoSeleccionado.id]: cantidad,
            })
          }
        />
      )}
    </div>
  );
};

export default PromosB2B;
