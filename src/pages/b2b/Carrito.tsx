import React, { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import { useNavigate } from "react-router-dom";
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
}

const MINIMO_COMPRA = 20000;

const CarritoB2B: React.FC = () => {
  const { user } = useAuth();
  const [carrito, setCarrito] = useState<Record<string, number>>({});
  const [productos, setProductos] = useState<Producto[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pedidoID, setPedidoID] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem("carrito_b2b");
    if (data) setCarrito(JSON.parse(data));
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [carrito, user?.catalogo]);

  const guardarCarrito = (nuevo: Record<string, number>) => {
    setCarrito(nuevo);
    localStorage.setItem("carrito_b2b", JSON.stringify(nuevo));
  };

  const cargarProductos = async () => {
    const ids = Object.keys(carrito).filter(Boolean);
    if (ids.length === 0) {
      setProductos([]);
      return;
    }

    const catalogoCliente = String(user?.catalogo || "").toUpperCase().trim();

    // Si el cliente no tiene catálogo asignado, no mostramos productos
    if (!catalogoCliente) {
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

    const prods = (data as Producto[]) || [];
    setProductos(prods);

    // Limpieza: si había productos en el carrito que ya no pertenecen al catálogo
    // del cliente o quedaron con stock < 50, los removemos del carrito.
    const idsOk = new Set(prods.map((p) => p.id));
    const faltantes = ids.filter((id) => !idsOk.has(id));

    if (faltantes.length > 0) {
      const copia = { ...carrito };
      let changed = false;

      for (const id of faltantes) {
        if (id in copia) {
          delete copia[id];
          changed = true;
        }
      }

      if (changed) guardarCarrito(copia);
    }
  };

  const precioConDescuento = (p: Producto) => {
    if (!p.categoria || p.categoria.trim() === "") return p.precio;
    return p.precio * 0.88;
  };

  const descuentoPorUnidad = (p: Producto) => {
    if (!p.categoria || p.categoria.trim() === "") return 0;
    return p.precio - precioConDescuento(p);
  };

  const totalSinDescuento = productos.reduce((acc, p) => {
    const qty = carrito[p.id] || 0;
    return acc + p.precio * qty;
  }, 0);

  const totalConDescuento = productos.reduce((acc, p) => {
    const qty = carrito[p.id] || 0;
    return acc + precioConDescuento(p) * qty;
  }, 0);

  const descuentoReal = totalSinDescuento - totalConDescuento;
  const totalFinal = totalConDescuento;
  const totalItems = Object.values(carrito).reduce((acc, v) => acc + v, 0);
  const cumpleMinimo = totalFinal >= MINIMO_COMPRA;

  const cambiarCantidad = (id: string, cantidad: number) => {
    if (cantidad <= 0) {
      const copia = { ...carrito };
      delete copia[id];
      guardarCarrito(copia);
      return;
    }
    guardarCarrito({ ...carrito, [id]: cantidad });
  };

  const fechaEntrega = () => {
    let fecha = new Date();

    const ahoraArgentina = new Date().toLocaleString("en-US", {
      timeZone: "America/Argentina/Buenos_Aires",
    });

    const now = new Date(ahoraArgentina);
    let diasHabiles = now.getHours() >= 15 ? 3 : 2;

    while (diasHabiles > 0) {
      fecha.setDate(fecha.getDate() + 1);
      if (![0, 6].includes(fecha.getDay())) diasHabiles--;
    }

    return fecha.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const confirmarPedidoFinal = async () => {
    try {
      if (!cumpleMinimo) return;
      if (!user) return;

      const { data: pedido, error } = await supabase
        .from("z_pedidos")
        .insert({
          cliente_id: user.id, // UUID correcto
          cliente_username: user.username, // Para pedidos
          created_by: "b2b-web",
          estado: "pendiente",
          total: totalFinal,
        })
        .select()
        .single();

      if (error) {
        console.error("ERROR CREANDO PEDIDO:", error);
        return;
      }

      setPedidoID(pedido.id);

      for (const p of productos) {
        const qty = carrito[p.id] || 0;
        if (qty <= 0) continue;

        await supabase.from("z_pedido_items").insert({
          pedido_id: pedido.id,
          producto_id: p.id,
          articulo: p.articulo,
          nombre: p.nombre,
          precio: precioConDescuento(p),
          cantidad: qty,
          subtotal: precioConDescuento(p) * qty,
        });
      }

      localStorage.removeItem("carrito_b2b");
      setCarrito({});
      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-6 space-y-4">
        <div className="bg-white rounded-xl border shadow p-4">
          <h2 className="text-xl font-bold text-gray-900">Carrito</h2>
          <p className="text-sm text-gray-600 mt-1">
            Revisá tus productos antes de confirmar el pedido.
          </p>
        </div>

        {productos.length === 0 ? (
          <div className="bg-white rounded-xl border shadow p-8 text-center text-gray-500">
            Tu carrito está vacío (o algunos productos ya no están disponibles
            para tu catálogo / stock mínimo).
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LISTA */}
            <div className="lg:col-span-2 bg-white rounded-xl border shadow p-4">
              <div className="space-y-4">
                {productos.map((p) => {
                  const qty = carrito[p.id] || 0;
                  if (!qty) return null;

                  const precioDesc = precioConDescuento(p);
                  const descU = descuentoPorUnidad(p);

                  return (
                    <div
                      key={p.id}
                      className="border rounded-xl p-3 flex gap-3"
                    >
                      <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                        {p.imagen_url ? (
                          <img
                            src={p.imagen_url}
                            alt={p.nombre}
                            className="max-h-full object-contain"
                          />
                        ) : (
                          <div className="text-[10px] text-gray-400 text-center px-1">
                            Sin imagen
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">
                          {p.nombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          {p.articulo} · Stock: {p.stock}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-extrabold text-gray-900">
                              $
                              {precioDesc.toLocaleString("es-AR", {
                                minimumFractionDigits: 0,
                              })}
                              <span className="text-xs font-semibold text-gray-400 line-through ml-2">
                                $
                                {p.precio.toLocaleString("es-AR", {
                                  minimumFractionDigits: 0,
                                })}
                              </span>
                            </p>

                            {descU > 0 && (
                              <p className="text-[11px] text-green-700 font-semibold">
                                Ahorrás $
                                {descU.toLocaleString("es-AR", {
                                  minimumFractionDigits: 0,
                                })}{" "}
                                por unidad
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => cambiarCantidad(p.id, qty - 1)}
                              className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold"
                            >
                              -
                            </button>
                            <div className="w-10 text-center font-bold">
                              {qty}
                            </div>
                            <button
                              onClick={() =>
                                cambiarCantidad(p.id, Math.min(qty + 1, p.stock))
                              }
                              className="w-10 h-10 rounded-lg bg-gray-900 hover:bg-black text-white font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RESUMEN */}
            <div className="bg-white rounded-xl border shadow p-4 space-y-3">
              <h3 className="text-base font-bold text-gray-900">Resumen</h3>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ítems</span>
                <span className="font-semibold">{totalItems}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total sin descuento</span>
                <span className="font-semibold">
                  ${totalSinDescuento.toLocaleString("es-AR")}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Descuento (12%)</span>
                <span className="font-semibold text-green-700">
                  -${descuentoReal.toLocaleString("es-AR")}
                </span>
              </div>

              <div className="border-t pt-3 flex justify-between">
                <span className="text-sm font-bold text-gray-900">
                  Total final
                </span>
                <span className="text-sm font-extrabold text-gray-900">
                  ${totalFinal.toLocaleString("es-AR")}
                </span>
              </div>

              <div className="text-xs text-gray-500">
                Entrega estimada: <b>{fechaEntrega()}</b>
              </div>

              {!cumpleMinimo && (
                <div className="text-xs text-red-600 font-semibold">
                  Mínimo de compra: $
                  {MINIMO_COMPRA.toLocaleString("es-AR")}. Te faltan $
                  {(MINIMO_COMPRA - totalFinal).toLocaleString("es-AR")}.
                </div>
              )}

              <button
                disabled={!cumpleMinimo}
                onClick={() => setShowConfirmModal(true)}
                className={`w-full rounded-lg py-2 text-sm font-semibold ${
                  cumpleMinimo
                    ? "bg-gray-900 hover:bg-black text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Confirmar pedido
              </button>

              <button
                onClick={() => navigate("/b2b/catalogo")}
                className="w-full border rounded-lg py-2 text-sm font-semibold"
              >
                Seguir comprando
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CONFIRM */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[92%] max-w-md">
            <h3 className="text-lg font-bold text-gray-900">
              Confirmar pedido
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              ¿Querés confirmar el pedido por $
              {totalFinal.toLocaleString("es-AR")}?
            </p>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 border rounded-lg py-2 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarPedidoFinal}
                className="flex-1 bg-gray-900 hover:bg-black text-white rounded-lg py-2 text-sm font-semibold"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL OK */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[92%] max-w-md">
            <h3 className="text-lg font-bold text-gray-900">¡Listo!</h3>
            <p className="text-sm text-gray-600 mt-2">
              Tu pedido fue generado correctamente.
              {pedidoID ? (
                <>
                  <br />
                  ID: <b>{pedidoID}</b>
                </>
              ) : null}
            </p>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate("/b2b/pedidos");
                }}
                className="flex-1 bg-gray-900 hover:bg-black text-white rounded-lg py-2 text-sm font-semibold"
              >
                Ver pedidos
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate("/b2b/catalogo");
                }}
                className="flex-1 border rounded-lg py-2 text-sm font-semibold"
              >
                Volver al catálogo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarritoB2B;
