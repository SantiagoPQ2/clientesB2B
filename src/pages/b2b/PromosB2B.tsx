import React, { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import { useNavigate } from "react-router-dom";
import CarritoSidePanel from "../../components/CarritoSidePanel";
import { useProductModal } from "../../context/ProductModalContext"; // ⭐ NUEVO

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
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();
  const { openProduct } = useProductModal(); // ⭐ NUEVO

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

  const cambiarCantidad = (id: string, cantidad: number, stock?: number) => {
    let nueva = Math.floor(cantidad || 0);
    if (stock && stock > 0) nueva = Math.min(nueva, stock);

    if (nueva <= 0) {
      const copia = { ...carrito };
      delete copia[id];
      guardarCarrito(copia);
    } else {
      guardarCarrito({ ...carrito, [id]: nueva });
    }
  };

  const agregarUno = (id: string, stock?: number) => {
    const actual = carrito[id] || 0;
    const nueva = stock && stock > 0 ? Math.min(actual + 1, stock) : actual + 1;
    cambiarCantidad(id, nueva, stock);
  };

  const handleVerCarritoFinal = () => {
    setShowModal(true);
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
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
                {promos.map((p) => {
                  const qty = carrito[p.id] || 0;
                  const maxed = p.stock > 0 && qty >= p.stock;

                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-xl border shadow-md hover:shadow-lg transition overflow-hidden flex flex-col cursor-pointer"
                      onClick={() => openProduct(p)} // ⭐ ABRIR MODAL IGUAL QUE CATÁLOGO
                    >
                      {/* Imagen */}
                      <div className="h-52 bg-gray-50 flex items-center justify-center">
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

                        <p className="text-xs text-gray-500 mt-1 mb-4">
                          {p.marca} • {p.categoria}
                        </p>

                        <div className="flex items-center justify-between mt-auto">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase">
                              Precio promo
                            </p>
                            <p className="text-xl font-bold text-red-600">
                              $
                              {(p.precio ?? 0).toLocaleString("es-AR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          </div>

                          {/* Botón / contador (NO se activa al hacer click en el card completo) */}
                          <div
                            className="z-20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {qty === 0 ? (
                              <button
                                disabled={p.stock <= 0}
                                onClick={() => agregarUno(p.id, p.stock)}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition shadow
                                ${
                                  p.stock <= 0
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-red-600 text-white hover:bg-red-700"
                                }`}
                              >
                                Agregar
                              </button>
                            ) : (
                              <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
                                <button
                                  onClick={() =>
                                    cambiarCantidad(p.id, qty - 1, p.stock)
                                  }
                                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  value={qty}
                                  min={0}
                                  onChange={(e) =>
                                    cambiarCantidad(
                                      p.id,
                                      Number(e.target.value),
                                      p.stock
                                    )
                                  }
                                  className="w-12 text-center text-sm font-semibold border-x border-gray-200 focus:outline-none"
                                />
                                <button
                                  disabled={maxed}
                                  onClick={() =>
                                    agregarUno(p.id, p.stock)
                                  }
                                  className={`px-3 py-1.5 text-sm ${
                                    maxed
                                      ? "text-gray-300 cursor-not-allowed"
                                      : "text-gray-600 hover:bg-gray-100"
                                  }`}
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CARRITO LATERAL */}
          <div className="lg:col-span-1 lg:pl-4 xl:pl-10">
            <CarritoSidePanel
              carrito={carrito}
              secondaryLabel="Ver catálogo"
              secondaryPath="/b2b/catalogo"
              onPrimaryClick={handleVerCarritoFinal}
            />
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl shadow-xl p-8 w-[90%] max-w-md animate-fadeIn">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              ¿Querés algo más?
            </h2>

            <p className="text-gray-500 text-center mb-6">
              Podés seguir navegando o finalizar tu compra.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  navigate("/b2b/catalogo");
                }}
                className="w-full py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
              >
                Ver catálogo
              </button>

              <button
                onClick={() => navigate("/b2b/carrito")}
                className="w-full py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
              >
                Ir al carrito final
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="text-sm text-gray-400 hover:text-gray-600 mt-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromosB2B;
