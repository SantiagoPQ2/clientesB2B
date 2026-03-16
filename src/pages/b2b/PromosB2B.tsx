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
          {/* CONTENIDO */}
          <div className="lg:col-span-3 space-y-5">
            {/* HEADER */}
            <div className="bg-white rounded-2xl vafood-shadow border border-gray-100 p-5 animate-fadeIn">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">
                    Promociones
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Aprovechá descuentos exclusivos online para tu catálogo.
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

            {/* FLYER PRINCIPAL */}
            <div className="relative overflow-hidden rounded-[28px] border border-red-100 bg-white vafood-shadow animate-fadeIn">
              {/* fondo decorativo */}
              <div className="absolute inset-0">
                <div className="absolute -top-16 -left-16 h-52 w-52 rounded-full bg-red-100/60 blur-2xl" />
                <div className="absolute top-10 right-10 h-44 w-44 rounded-full bg-amber-100/60 blur-2xl" />
                <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-rose-100/60 blur-2xl" />
              </div>

              <div className="relative z-10 p-6 sm:p-8 lg:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-8 items-center">
                  {/* TEXTO */}
                  <div>
                    <div className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-extrabold tracking-wide text-red-700">
                      PROMO ONLINE EXCLUSIVA
                    </div>

                    <h3 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-gray-900">
                      Comprá más y
                      <span className="block text-red-600">ahorrá un 12%</span>
                    </h3>

                    <p className="mt-4 max-w-2xl text-sm sm:text-base text-gray-600 leading-relaxed">
                      Hacé tu pedido online y obtené un descuento automático en
                      toda tu compra superando el mínimo promocional.
                    </p>

                    <div className="mt-6">
                      <div className="rounded-[24px] border border-red-100 bg-gradient-to-br from-red-50 via-white to-rose-50 p-6 shadow-sm max-w-[680px]">
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                          Beneficio exclusivo
                        </div>

                        <div className="mt-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                          <div>
                            <div className="text-4xl sm:text-5xl font-black text-red-600 leading-none">
                              12% OFF
                            </div>
                            <p className="mt-3 text-base sm:text-lg font-bold text-gray-900">
                              En toda tu compra desde $25.000
                            </p>
                            <p className="mt-2 text-sm text-gray-500">
                              El descuento se aplica automáticamente al total del
                              pedido online.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-red-200 bg-white px-5 py-4 min-w-[180px]">
                            <div className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
                              Mínimo promocional
                            </div>
                            <div className="mt-1 text-3xl font-black text-gray-900">
                              $25.000
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => navigate("/b2b/catalogo")}
                        className="inline-flex items-center justify-center rounded-2xl px-6 py-4 text-base font-extrabold text-white shadow-lg transition hover:opacity-95 vafood-gradient"
                      >
                        Ir al catálogo y comprar ahora
                      </button>

                      <button
                        onClick={() => {
                          const section = document.getElementById("promos-grid");
                          section?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-4 text-base font-bold text-gray-700 hover:border-red-200 hover:text-red-600 transition"
                      >
                        Ver promociones disponibles
                      </button>
                    </div>

                    <div className="mt-4 text-xs text-gray-500">
                      Promoción válida para compras online sujetas a catálogo y
                      stock disponible.
                    </div>
                  </div>

                  {/* PANEL VISUAL DERECHO */}
                  <div className="relative">
                    <div className="rounded-[24px] border border-gray-100 bg-gradient-to-br from-gray-900 via-gray-800 to-red-900 p-6 text-white shadow-2xl">
                      <div className="text-xs font-bold uppercase tracking-[0.22em] text-red-200">
                        Oferta destacada
                      </div>

                      <div className="mt-4 space-y-4">
                        <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4 border border-white/10">
                          <div className="text-sm text-white/80">
                            Compra mínima
                          </div>
                          <div className="mt-1 text-3xl font-black">
                            $25.000
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4 border border-white/10">
                          <div className="text-sm text-white/80">
                            Beneficio activo
                          </div>
                          <div className="mt-1 text-3xl font-black">
                            12% OFF
                          </div>
                        </div>

                        <div className="rounded-2xl bg-red-500/20 border border-red-300/20 p-4">
                          <div className="text-sm font-semibold text-red-100">
                            Aplicación
                          </div>
                          <div className="mt-1 text-2xl font-black text-white leading-tight">
                            En todo el pedido
                          </div>
                          <div className="mt-1 text-sm text-red-100/90">
                            automático al superar el mínimo
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LISTADO DE PROMOS */}
            <div id="promos-grid">
              {promos.length === 0 ? (
                <div className="bg-white rounded-2xl vafood-shadow border border-gray-100 p-8 text-center animate-fadeIn">
                  <p className="text-gray-700 font-semibold text-lg">
                    Hoy no hay combos cargados, pero tu beneficio online sigue activo.
                  </p>
                  <p className="mt-2 text-sm text-gray-500 max-w-2xl mx-auto">
                    Entrá al catálogo y armá tu pedido para aprovechar el 12% OFF
                    en toda tu compra desde $25.000.
                  </p>

                  <button
                    onClick={() => navigate("/b2b/catalogo")}
                    className="mt-6 inline-flex items-center justify-center rounded-2xl px-8 py-4 text-base font-extrabold text-white shadow-lg transition hover:opacity-95 vafood-gradient"
                  >
                    Ver catálogo completo
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-lg font-extrabold text-gray-900">
                      Promociones disponibles
                    </h3>
                    <button
                      onClick={() => navigate("/b2b/catalogo")}
                      className="text-sm font-bold text-red-600 hover:text-red-700 transition"
                    >
                      Ir al catálogo →
                    </button>
                  </div>

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
                                Promo online
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
                              Aprovechá tu descuento online vigente.
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
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

      {/* MODAL */}
      {productoSeleccionado && (
        <ProductoModal
          producto={productoSeleccionado}
          cantidadInicial={carrito[productoSeleccionado.id] || 0}
          onClose={() => setProductoSeleccionado(null)}
          onConfirm={(cantidad) => {
            const nuevoCarrito = { ...carrito };

            if (cantidad <= 0) {
              delete nuevoCarrito[productoSeleccionado.id];
            } else {
              nuevoCarrito[productoSeleccionado.id] = cantidad;
            }

            guardarCarrito(nuevoCarrito);
          }}
        />
      )}
    </div>
  );
};

export default PromosB2B;
