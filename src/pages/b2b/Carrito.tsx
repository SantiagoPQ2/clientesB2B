import React, { useEffect, useMemo, useState } from "react";
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

interface PedidoConfirmadoResumen {
  id: string;
  descuento: number;
  entregaLabel: string;
  totalFinal: number;
}

const MINIMO_COMPRA = 25000;

const CarritoB2B: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [carrito, setCarrito] = useState<Record<string, number>>({});
  const [productos, setProductos] = useState<Producto[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pedidoID, setPedidoID] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  const [pedidoConfirmado, setPedidoConfirmado] =
    useState<PedidoConfirmadoResumen | null>(null);

  // ======================
  // init carrito
  // ======================
  useEffect(() => {
    const data = localStorage.getItem("carrito_b2b");
    if (data) setCarrito(JSON.parse(data));
  }, []);

  const guardarCarrito = (nuevo: Record<string, number>) => {
    setCarrito(nuevo);
    localStorage.setItem("carrito_b2b", JSON.stringify(nuevo));
  };

  // ======================
  // cargar productos del carrito
  // ======================
  useEffect(() => {
    const run = async () => {
      const ids = Object.keys(carrito).filter(Boolean);

      if (ids.length === 0) {
        setProductos([]);
        return;
      }

      const catalogoCliente = String((user as any)?.catalogo || "")
        .toUpperCase()
        .trim();

      if (!catalogoCliente) {
        setProductos([]);
        return;
      }

      const { data, error } = await supabase
        .from("z_productos")
        .select("*")
        .eq("activo", true)
        .ilike("catalogo", catalogoCliente)
        .gte("stock", 50)
        .in("id", ids);

      if (error) {
        console.error("Error cargando productos del carrito:", error);
        setProductos([]);
        return;
      }

      const prods = (data as Producto[]) || [];
      setProductos(prods);

      // Limpieza de carrito si algún producto ya no corresponde
      const ok = new Set(prods.map((p) => p.id));
      const faltan = ids.filter((id) => !ok.has(id));

      if (faltan.length) {
        const copia = { ...carrito };
        let changed = false;

        for (const id of faltan) {
          if (id in copia) {
            delete copia[id];
            changed = true;
          }
        }

        if (changed) guardarCarrito(copia);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(carrito), (user as any)?.catalogo]);

  // ======================
  // helpers promo
  // ======================
  const esVinoDivision = (categoria?: string) => {
    return String(categoria || "").trim().toLowerCase() === "vinos division";
  };

  const totalItems = useMemo(
    () => Object.values(carrito).reduce((acc, v) => acc + (v || 0), 0),
    [carrito]
  );

  const totalSinDescuento = useMemo(() => {
    return productos.reduce((acc, p) => {
      const qty = carrito[p.id] || 0;
      return acc + (p.precio || 0) * qty;
    }, 0);
  }, [productos, carrito]);

  const cantidadVinosDivision = useMemo(() => {
    return productos.reduce((acc, p) => {
      if (!esVinoDivision(p.categoria)) return acc;
      return acc + (carrito[p.id] || 0);
    }, 0);
  }, [productos, carrito]);

  const porcentajeDescuento = useMemo(() => {
    if (totalSinDescuento < MINIMO_COMPRA) return 0;
    if (cantidadVinosDivision >= 3) return 13.5;
    return 12;
  }, [totalSinDescuento, cantidadVinosDivision]);

  const descuentoReal = useMemo(() => {
    return totalSinDescuento * (porcentajeDescuento / 100);
  }, [totalSinDescuento, porcentajeDescuento]);

  const totalFinal = useMemo(() => {
    return totalSinDescuento - descuentoReal;
  }, [totalSinDescuento, descuentoReal]);

  const cumpleMinimo = totalSinDescuento >= MINIMO_COMPRA;

  const cambiarCantidad = (id: string, cantidad: number, stock: number) => {
    const nueva = Math.max(0, Math.min(Math.floor(cantidad || 0), stock));

    if (nueva <= 0) {
      const copia = { ...carrito };
      delete copia[id];
      guardarCarrito(copia);
      return;
    }

    guardarCarrito({ ...carrito, [id]: nueva });
  };

  // ======================
  // fecha entrega
  // ======================
  const calcularFechaEntrega = () => {
    const ahoraArgentina = new Date(
      new Date().toLocaleString("en-US", {
        timeZone: "America/Argentina/Buenos_Aires",
      })
    );

    const fecha = new Date(ahoraArgentina);
    let diasHabiles = ahoraArgentina.getHours() >= 15 ? 3 : 2;

    while (diasHabiles > 0) {
      fecha.setDate(fecha.getDate() + 1);
      if (![0, 6].includes(fecha.getDay())) diasHabiles--;
    }

    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const dd = String(fecha.getDate()).padStart(2, "0");

    return {
      date: fecha,
      iso: `${yyyy}-${mm}-${dd}`,
      label: fecha.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    };
  };

  const entrega = useMemo(() => calcularFechaEntrega(), []);

  // ======================
  // confirmar pedido
  // ======================
  const confirmarPedidoFinal = async () => {
    try {
      if (!cumpleMinimo) return;
      if (!user) return;
      if (confirmando) return;

      setConfirmando(true);

      // Snapshot para que no cambie a 0% después de vaciar carrito
      const descuentoAplicado = porcentajeDescuento;
      const entregaLabel = entrega.label;
      const entregaIso = entrega.iso;
      const totalFinalPedido = totalFinal;

      const { data: pedido, error } = await supabase
        .from("z_pedidos")
        .insert({
          cliente_id: (user as any).id,
          cliente_username: (user as any).username,
          created_by: "b2b-web",
          estado: "pendiente",
          total: totalFinalPedido,
          fecha_entrega: entregaIso,
          porcentaje_descuento: descuentoAplicado,
        })
        .select()
        .single();

      if (error || !pedido) {
        console.error("ERROR CREANDO PEDIDO:", error);
        setConfirmando(false);
        return;
      }

      setPedidoID(pedido.id);

      for (const p of productos) {
        const qty = carrito[p.id] || 0;
        if (qty <= 0) continue;

        const precioUnitarioFinal = p.precio * (1 - descuentoAplicado / 100);

        const { error: itemError } = await supabase
          .from("z_pedido_items")
          .insert({
            pedido_id: pedido.id,
            producto_id: p.id,
            articulo: p.articulo,
            nombre: p.nombre,
            precio: Number(precioUnitarioFinal.toFixed(2)),
            cantidad: qty,
            subtotal: Number((precioUnitarioFinal * qty).toFixed(2)),
            fecha_entrega: entregaIso,
          });

        if (itemError) {
          console.error("Error insertando item:", itemError);
        }
      }

      setPedidoConfirmado({
        id: pedido.id,
        descuento: descuentoAplicado,
        entregaLabel,
        totalFinal: totalFinalPedido,
      });

      localStorage.removeItem("carrito_b2b");
      setCarrito({});
      setShowConfirmModal(false);
      setShowSuccessModal(true);
      setConfirmando(false);
    } catch (e) {
      console.error(e);
      setConfirmando(false);
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-6 space-y-4">
        {/* Header */}
        <div className="bg-white rounded-2xl vafood-shadow border border-gray-100 p-5 animate-fadeIn">
          <h2 className="text-xl font-extrabold text-gray-900">Carrito</h2>
          <p className="text-sm text-gray-500 mt-1">
            Revisá tus productos antes de confirmar el pedido.
          </p>
        </div>

        {productos.length === 0 ? (
          <div className="bg-white rounded-2xl vafood-shadow border border-gray-100 p-8 text-center text-gray-500 animate-fadeIn">
            Tu carrito está vacío (o algunos productos ya no están disponibles
            para tu catálogo / stock mínimo).
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LISTA */}
            <div className="lg:col-span-2 bg-white rounded-2xl vafood-shadow border border-gray-100 p-4 animate-fadeIn">
              <div className="space-y-4">
                {productos.map((p) => {
                  const qty = carrito[p.id] || 0;
                  if (!qty) return null;

                  const precioFinalUnitario =
                    p.precio * (1 - porcentajeDescuento / 100);
                  const ahorroUnitario = p.precio - precioFinalUnitario;

                  return (
                    <div
                      key={p.id}
                      className="border border-gray-100 rounded-2xl p-4 flex gap-4 hover:shadow-md transition-all duration-200"
                    >
                      <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
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
                        <p className="text-sm font-extrabold text-gray-900">
                          {p.nombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          {p.articulo} · Stock: {p.stock}
                        </p>

                        {esVinoDivision(p.categoria) && (
                          <p className="text-[11px] text-violet-700 font-semibold mt-1">
                            Vino división
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-base font-extrabold text-red-600">
                              $
                              {precioFinalUnitario.toLocaleString("es-AR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                              <span className="text-xs font-semibold text-gray-400 line-through ml-2">
                                $
                                {p.precio.toLocaleString("es-AR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </p>

                            {porcentajeDescuento > 0 && (
                              <p className="text-[11px] text-emerald-700 font-semibold">
                                Ahorrás $
                                {ahorroUnitario.toLocaleString("es-AR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                por unidad
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                cambiarCantidad(p.id, qty - 1, p.stock)
                              }
                              className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 font-extrabold text-gray-700 transition"
                            >
                              −
                            </button>

                            <div className="min-w-10 text-center font-extrabold text-gray-900">
                              {qty}
                            </div>

                            <button
                              onClick={() =>
                                cambiarCantidad(p.id, qty + 1, p.stock)
                              }
                              className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 font-extrabold text-red-700 transition"
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
            <div className="bg-white rounded-2xl vafood-shadow border border-gray-100 p-5 space-y-3 animate-fadeIn">
              <h3 className="text-base font-extrabold text-gray-900">
                Resumen
              </h3>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ítems</span>
                <span className="font-semibold">{totalItems}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Vinos división</span>
                <span className="font-semibold">{cantidadVinosDivision}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total sin descuento</span>
                <span className="font-semibold">
                  $
                  {totalSinDescuento.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Descuento ({porcentajeDescuento}%)
                </span>
                <span className="font-semibold text-emerald-700">
                  -$
                  {descuentoReal.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="border-t pt-3 flex justify-between items-end">
                <span className="text-sm font-extrabold text-gray-900">
                  Total final
                </span>
                <span className="text-lg font-extrabold text-red-600">
                  $
                  {totalFinal.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="text-xs text-gray-500">
                Entrega estimada:{" "}
                <b className="text-gray-700">{entrega.label}</b>
              </div>

              <div className="text-xs rounded-xl p-3 border bg-gray-50 text-gray-700">
                {porcentajeDescuento === 13.5 ? (
                  <>
                    Promo aplicada: <b>13,5% OFF</b> por superar $
                    {MINIMO_COMPRA.toLocaleString("es-AR")} y llevar{" "}
                    <b>3 o más vinos división</b>.
                  </>
                ) : porcentajeDescuento === 12 ? (
                  <>
                    Promo aplicada: <b>12% OFF</b> por superar $
                    {MINIMO_COMPRA.toLocaleString("es-AR")}.
                    {cantidadVinosDivision < 3 && (
                      <>
                        {" "}
                        Sumando{" "}
                        <b>{3 - cantidadVinosDivision} vino(s) división más</b>,
                        pasás a <b>13,5% OFF</b>.
                      </>
                    )}
                  </>
                ) : (
                  <>
                    Superando ${MINIMO_COMPRA.toLocaleString("es-AR")} obtenés{" "}
                    <b>12% OFF</b>. Y con <b>3 vinos división o más</b>, obtenés{" "}
                    <b>13,5% OFF</b> en toda la compra.
                  </>
                )}
              </div>

              {!cumpleMinimo && (
                <div className="text-xs text-red-600 font-semibold bg-red-50 border border-red-100 rounded-xl p-3">
                  Mínimo de compra para activar promo: $
                  {MINIMO_COMPRA.toLocaleString("es-AR")}. Te faltan $
                  {(MINIMO_COMPRA - totalSinDescuento).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  .
                </div>
              )}

              <button
                disabled={!cumpleMinimo}
                onClick={() => setShowConfirmModal(true)}
                className={`w-full rounded-xl py-2.5 text-sm font-extrabold shadow-sm transition ${
                  cumpleMinimo
                    ? "vafood-gradient hover:opacity-[0.96] text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Confirmar pedido
              </button>

              <button
                onClick={() => navigate("/b2b/catalogo")}
                className="w-full border border-gray-200 rounded-xl py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Seguir comprando
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CONFIRMACIÓN */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[92%] max-w-md animate-fadeIn">
            <h3 className="text-lg font-extrabold text-gray-900">
              Confirmar pedido
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Estimamos entrega para <b>{entrega.label}</b>.
              <br />
              Se aplicará un descuento de <b>{porcentajeDescuento}%</b>.
              <br />
              Total final:{" "}
              <b>
                $
                {totalFinal.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </b>
            </p>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={confirmando}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarPedidoFinal}
                disabled={confirmando}
                className="flex-1 vafood-gradient hover:opacity-[0.96] text-white rounded-xl py-2.5 text-sm font-extrabold shadow-sm transition disabled:opacity-60"
              >
                {confirmando ? "Confirmando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ÉXITO */}
      {showSuccessModal && pedidoConfirmado && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[92%] max-w-md animate-fadeIn">
            <h3 className="text-lg font-extrabold text-gray-900">¡Listo!</h3>
            <p className="text-sm text-gray-600 mt-2">
              Tu pedido fue generado correctamente.
              <br />
              Entrega estimada: <b>{pedidoConfirmado.entregaLabel}</b>
              <br />
              Descuento aplicado: <b>{pedidoConfirmado.descuento}%</b>
              <br />
              Total final:{" "}
              <b>
                $
                {pedidoConfirmado.totalFinal.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </b>
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
                className="flex-1 vafood-gradient hover:opacity-[0.96] text-white rounded-xl py-2.5 text-sm font-extrabold shadow-sm transition"
              >
                Ver pedidos
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate("/b2b/catalogo");
                }}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
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
