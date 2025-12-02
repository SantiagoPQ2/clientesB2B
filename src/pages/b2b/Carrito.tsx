import React, { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import { useNavigate } from "react-router-dom";

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

const CarritoB2B: React.FC = () => {
  const [carrito, setCarrito] = useState<Record<string, number>>({});
  const [productos, setProductos] = useState<Producto[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const navigate = useNavigate();

  // ============================
  // Cargar carrito desde storage
  // ============================
  useEffect(() => {
    const data = localStorage.getItem("carrito_b2b");
    if (data) setCarrito(JSON.parse(data));
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [carrito]);

  const guardarCarrito = (nuevo: Record<string, number>) => {
    setCarrito(nuevo);
    localStorage.setItem("carrito_b2b", JSON.stringify(nuevo));
  };

  // ============================
  // Cargar productos
  // ============================
  const cargarProductos = async () => {
    const ids = Object.keys(carrito);
    if (ids.length === 0) return setProductos([]);

    const { data } = await supabase
      .from("z_productos")
      .select("*")
      .in("id", ids);

    setProductos((data as Producto[]) || []);
  };

  // ============================
  // Totales
  // ============================
  const subtotal = productos.reduce(
    (acc, p) => acc + p.precio * (carrito[p.id] || 0),
    0
  );

  const descuento = subtotal * 0.12;
  const totalConDescuento = subtotal - descuento;

  const totalItems = Object.values(carrito).reduce(
    (acc, v) => acc + (v || 0),
    0
  );

  // ============================
  // Cambiar cantidad
  // ============================
  const cambiarCantidad = (id: string, cantidad: number) => {
    if (cantidad <= 0) {
      const copia = { ...carrito };
      delete copia[id];
      guardarCarrito(copia);
      return;
    }

    guardarCarrito({ ...carrito, [id]: cantidad });
  };

  // ============================
  // Cálculo de fecha estimada (Opción C – +2 días hábiles)
  // ============================
  const fechaEntrega = () => {
    let fecha = new Date();
    let diasAgregados = 0;

    while (diasAgregados < 2) {
      fecha.setDate(fecha.getDate() + 1);
      const esFinDeSemana =
        fecha.getDay() === 0 || fecha.getDay() === 6;

      if (!esFinDeSemana) diasAgregados++;
    }

    return fecha.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  // ============================
  // Finalizar pedido
  // ============================
  const confirmarPedidoFinal = async () => {
    const { data: pedido, error } = await supabase
      .from("z_pedidos")
      .insert({
        created_by: "admin",
        total: totalConDescuento,
        subtotal: subtotal,
        descuento: descuento,
      })
      .select()
      .single();

    if (error || !pedido) {
      alert("Error al crear pedido");
      return;
    }

    for (const p of productos) {
      const qty = carrito[p.id] || 0;
      if (!qty) continue;

      await supabase.from("z_pedido_items").insert({
        pedido_id: pedido.id,
        producto_id: p.id,
        articulo: p.articulo,
        nombre: p.nombre,
        cantidad: qty,
        precio_unitario: p.precio,
        subtotal: p.precio * qty,
      });
    }

    localStorage.removeItem("carrito_b2b");
    setCarrito({});
    alert("Pedido confirmado correctamente");
    navigate("/b2b/pedidos");
  };

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* ============================
            CUERPO PRINCIPAL
        ============================ */}
        {productos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            Tu carrito está vacío.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ============================
                LISTA DE PRODUCTOS
            ============================ */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-100">

              <div className="border-b border-gray-100 px-4 py-3 flex justify-between text-sm text-gray-500">
                <span>Productos ({totalItems})</span>
                <span>Subtotal</span>
              </div>

              <div className="divide-y divide-gray-100">
                {productos.map((p) => {
                  const qty = carrito[p.id] || 0;
                  const subtotalProd = p.precio * qty;

                  return (
                    <div key={p.id} className="px-4 py-3 flex items-center gap-4">

                      {/* Imagen */}
                      <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center">
                        {p.imagen_url ? (
                          <img src={p.imagen_url} className="max-h-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-gray-400">{p.articulo}</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{p.nombre}</p>
                            <p className="text-xs text-gray-500">
                              {p.marca} • {p.categoria}
                            </p>
                          </div>

                          <p className="font-semibold text-red-600">
                            ${subtotalProd.toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>

                        {/* Contador */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              className="px-3 py-1 hover:bg-gray-100"
                              onClick={() => cambiarCantidad(p.id, qty - 1)}
                            >
                              −
                            </button>

                            <input
                              type="number"
                              className="w-14 text-center outline-none"
                              value={qty}
                              onChange={(e) =>
                                cambiarCantidad(p.id, Number(e.target.value))
                              }
                            />

                            <button
                              className="px-3 py-1 hover:bg-gray-100"
                              onClick={() => cambiarCantidad(p.id, qty + 1)}
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => cambiarCantidad(p.id, 0)}
                            className="text-xs text-gray-400 hover:text-red-600"
                          >
                            Eliminar
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ============================
                RESUMEN DEL PEDIDO
            ============================ */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 flex flex-col gap-4 h-fit">

              <div>
                <h3 className="text-base font-semibold text-gray-900">Resumen del pedido</h3>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Productos</span>
                <span className="font-semibold">{totalItems} ítems</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">
                  ${subtotal.toLocaleString("es-AR")}
                </span>
              </div>

              <div className="flex justify-between text-sm text-green-700">
                <span>Descuento especial 12%</span>
                <span>- ${descuento.toLocaleString("es-AR")}</span>
              </div>

              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-semibold text-gray-700">Total con descuento</span>
                <span className="text-xl font-bold text-red-600">
                  ${totalConDescuento.toLocaleString("es-AR")}
                </span>
              </div>

              <button
                onClick={() => setShowConfirmModal(true)}
                className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold"
              >
                Confirmar pedido
              </button>

            </div>

          </div>
        )}
      </div>

      {/* ============================
          MODAL DE CONFIRMACIÓN FINAL
      ============================ */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 w-[90%] max-w-md">

            <h2 className="text-xl font-semibold text-center text-gray-800">
              Confirmación de pedido
            </h2>

            <p className="text-center mt-3 text-gray-600">
              Su pedido final es de{" "}
              <span className="font-bold text-red-600">
                ${totalConDescuento.toLocaleString("es-AR")}
              </span>
            </p>

            <p className="text-center mt-4 text-gray-600">
              La entrega final será el{" "}
              <span className="font-semibold">{fechaEntrega()}</span>.
            </p>

            <p className="text-center mt-2 text-gray-500 text-sm">
              El mismo será abonado contra entrega o acordado con el transportista.
            </p>

            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={confirmarPedidoFinal}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold"
              >
                Confirmar pedido
              </button>

              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold"
              >
                Revisar pedido
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CarritoB2B;
