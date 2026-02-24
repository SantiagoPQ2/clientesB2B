import React, { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import { useNavigate } from "react-router-dom";
import CarritoSidePanel from "../../components/CarritoSidePanel";
import { useProductModal } from "../../context/ProductModalContext";
import { useAuth } from "../../context/AuthContext";

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
  const [promos, setPromos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<Record<string, number>>({});
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();
  const { openProduct } = useProductModal();

  useEffect(() => {
    cargarCarrito();
  }, []);

  useEffect(() => {
    cargarPromos();
  }, [user?.catalogo]);

  const cargarCarrito = () => {
    const data = localStorage.getItem("carrito_b2b");
    if (data) setCarrito(JSON.parse(data));
  };

  const guardarCarrito = (nuevo: Record<string, number>) => {
    setCarrito(nuevo);
    localStorage.setItem("carrito_b2b", JSON.stringify(nuevo));
  };

  const cargarPromos = async () => {
    const catalogoCliente = String(user?.catalogo || "").toUpperCase().trim();

    if (!catalogoCliente) {
      setPromos([]);
      return;
    }

    const { data, error } = await supabase
      .from("z_productos")
      .select("*")
      .eq("catalogo", catalogoCliente)
      .gte("stock", 50)
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
    const nueva =
      stock && stock > 0 ? Math.min(actual + 1, stock) : actual + 1;
    cambiarCantidad(id, nueva, stock);
  };

  const handleVerCarritoFinal = () => {
    setShowModal(true);
  };

  return (
    <div className="w-full">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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
                      className="bg-white rounded-xl border shadow-md hover:shadow-lg transition overflow-hidden flex flex-col"
                    >
                      <div
                        className="cursor-pointer"
                        onClick={() => openProduct(p)}
                      >
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

                        <div className="p-4">
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-md">
                            PROMO
                          </span>

                          <p className="mt-2 text-sm font-bold text-gray-900 line-clamp-2">
                            {p.nombre}
                          </p>

                          <p className="text-xs text-gray-500">
                            Código: {p.articulo}
                          </p>

                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-sm font-extrabold text-gray-900">
                              $
                              {Number(p.precio || 0).toLocaleString("es-AR")}
                            </p>

                            <p className="text-[11px] text-gray-500">
                              Stock: {p.stock}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-0 mt-auto">
                        {qty <= 0 ? (
                          <button
                            onClick={() => agregarUno(p.id, p.stock)}
                            className="w-full bg-gray-900 hover:bg-black text-white rounded-lg py-2 text-sm font-semibold"
                          >
                            Agregar
                          </button>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <button
                              onClick={() =>
                                cambiarCantidad(p.id, qty - 1, p.stock)
                              }
                              className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-gray-800"
                            >
                              -
                            </button>

                            <div className="text-sm font-bold text-gray-900">
                              {qty}
                            </div>

                            <button
                              onClick={() => agregarUno(p.id, p.stock)}
                              disabled={maxed}
                              className={`w-10 h-10 rounded-lg font-bold ${
                                maxed
                                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-900 hover:bg-black text-white"
                              }`}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <CarritoSidePanel
            carrito={carrito}
            secondaryLabel="Ir al catálogo"
            secondaryPath="/b2b/catalogo"
            primaryLabel="Ver carrito final"
            onPrimaryClick={handleVerCarritoFinal}
          />
        </div>
      </div>

      {/* Modal simple para ir al carrito */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[92%] max-w-md">
            <h3 className="text-lg font-bold text-gray-900">
              ¿Querés finalizar tu pedido?
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Te llevamos al carrito final para revisar cantidades y confirmar.
            </p>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border rounded-lg py-2 text-sm font-semibold"
              >
                Seguir comprando
              </button>
              <button
                onClick={() => navigate("/b2b/carrito")}
                className="flex-1 bg-gray-900 hover:bg-black text-white rounded-lg py-2 text-sm font-semibold"
              >
                Ir al carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromosB2B;
