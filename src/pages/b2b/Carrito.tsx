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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pedidoID, setPedidoID] = useState<string | null>(null);
  const navigate = useNavigate();

  /* ============================
        Cargar carrito
  ============================ */
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

  /* ============================
        Cargar productos
  ============================ */
  const cargarProductos = async () => {
    const ids = Object.keys(carrito);
    if (ids.length === 0) return setProductos([]);

    const { data, error } = await supabase
      .from("z_productos")
      .select("*")
      .in("id", ids);

    if (error) console.error(error);

    setProductos((data as Producto[]) || []);
  };

  /* ============================
        Totales
  ============================ */
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

  /* ============================
        Cambiar cantidad
  ============================ */
  const cambiarCantidad = (id: string, cantidad: number) => {
    if (cantidad <= 0) {
      const copia = { ...carrito };
      delete copia[id];
      guardarCarrito(copia);
      return;
    }
    guardarCarrito({ ...carrito, [id]: cantidad });
  };

  /* ============================
        Fecha entrega
  ============================ */
  const fechaEntrega = () => {
    let fecha = new Date();
    let dias = 0;
    while (dias < 2) {
      fecha.setDate(fecha.getDate() + 1);
      if (![0, 6].includes(fecha.getDay())) dias++;
    }

    return fecha.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  /* ============================
        CREAR PEDIDO (FIX REAL)
  ============================ */
  const confirmarPedidoFinal = async () => {
    try {
      // 1) Traer usuario logueado
      const { data: session, error: userError } = await supabase.auth.getUser();

      if (userError || !session?.user) {
        alert("Debes iniciar sesión.");
        return;
      }

      const user = session.user;

      // 2) Crear pedido en z_pedidos
      const { data: pedido, error: pedidoError } = await supabase
        .from("z_pedidos")
        .insert({
          cliente_id: user.id, // UUID real del usuario
          estado: "pendiente",
          total: totalConDescuento, // único campo numérico permitido
        })
        .select("id")
        .single();

      if (pedidoError || !pedido) {
        console.error("Error creando pedido:", pedidoError);
        alert("Error al confirmar el pedido.");
        setShowConfirmModal(false);
        return;
      }

      const pedidoId = pedido.id;
      setPedidoID(pedidoId);

      // 3) Guardar items
      const items = productos
        .map((p) => {
          const qty = carrito[p.id] || 0;
          if (qty <= 0) return null;

          return {
            pedido_id: pedidoId,
            producto_id: p.id,
            articulo: p.articulo,
            nombre: p.nombre,
            cantidad: qty,
            precio_unitario: p.precio,
            subtotal: p.precio * qty,
          };
        })
        .filter(Boolean);

      const { error: itemsError } = await supabase
        .from("z_pedido_items")
        .insert(items);

      if (itemsError) {
        console.error("Error guardando items:", itemsError);
        alert("Error al guardar los productos del pedido");
        return;
      }

      // 4) Limpiar carrito
      localStorage.removeItem("carrito_b2b");
      setCarrito({});

      // 5) Mostrar modal de éxito
      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error inesperado:", err);
      alert("Error inesperado al confirmar pedido");
    }
  };

  /* ============================
        UI PRINCIPAL
  ============================ */
  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto px-4 py-6">

        {productos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            Tu carrito está vacío.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LISTA DE PRODUCTOS */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-100">
              <div className="border-b px-4 py-3 text-sm text-gray-500 flex justify-between">
                <span>Productos ({totalItems})</span>
                <span>Subtotal</span>
              </div>

              <div className="divide-y divide-gray-100">
                {productos.map((p) => {
                  const qty = carrito[p.id] || 0;
                  return (
                    <div key={p.id} className="px-4 py-3 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center">
                        {p.imagen_url ? (
                          <img src={p.imagen_url} className="max-h-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-gray-400">{p.articulo}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-semibold">{p.nombre}</p>
                            <p className="text-xs text-gray-500">{p.marca} • {p.categoria}</p>
                          </div>

                          <p className="font-semibold text-red-600">
                            ${(p.precio * qty).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>

                        <div className="flex justify-between mt-3">
                          <div className="flex items-center border rounded-lg overflow-hidden">
                            <button onClick={() => cambiarCantidad(p.id, qty - 1)} className="px-3 py-1">−</button>
                            <input
                              type="number"
                              className="w-14 text-center outline-none"
                              value={qty}
                              onChange={(e) => cambiarCantidad(p.id, Number(e.target.value))}
                            />
                            <button onClick={() => cambiarCantidad(p.id, qty + 1)} className="px-3 py-1">+</button>
                          </div>

                          <button onClick={() => cambiarCantidad(p.id, 0)} className="text-xs text-gray-400 hover:text-red-600">
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RESUMEN */}
            <div className="bg-white rounded-xl shadow-md border p-5 flex flex-col gap-4 h-fit">

              <h3 className="text-base font-semibold">Resumen del pedido</h3>

              <div className="flex justify-between text-sm">
                <span>Productos</span>
                <span className="font-semibold">{totalItems} ítems</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-semibold">${subtotal.toLocaleString("es-AR")}</span>
              </div>

              <div className="flex justify-between text-sm text-green-700">
                <span>Descuento especial 12%</span>
                <span>- ${descuento.toLocaleString("es-AR")}</span>
              </div>

              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Total con descuento</span>
                <span className="text-xl font-bold text-red-600">
                  ${totalConDescuento.toLocaleString("es-AR")}
                </span>
              </div>

              <button
                onClick={() => setShowConfirmModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold"
              >
                Confirmar pedido
              </button>

            </div>

          </div>
        )}
      </div>

      {/* MODAL CONFIRMAR */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 w-[90%] max-w-md">

            <h2 className="text-xl font-semibold text-center">Confirmación de pedido</h2>

            <p className="text-center mt-3 text-gray-600">
              Su pedido final es de{" "}
              <span className="font-bold text-red-600">
                ${totalConDescuento.toLocaleString("es-AR")}
              </span>
            </p>

            <p className="text-center mt-4 text-gray-600">
              La entrega será el <span className="font-semibold">{fechaEntrega()}</span>.
            </p>

            <p className="text-center text-gray-500 text-sm mt-2">
              Se abonará contra entrega o según acuerdo.
            </p>

            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={confirmarPedidoFinal}
                className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold"
              >
                Confirmar pedido
              </button>

              <button
                onClick={() => setShowConfirmModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold"
              >
                Revisar pedido
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL SUCCESS */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl p-10 w-[90%] max-w-md text-center">

            <div className="text-green-600 text-6xl mb-4">✓</div>

            <h2 className="text-2xl font-bold text-gray-800">
              ¡Pedido confirmado!
            </h2>

            <p className="text-gray-600 mt-2">
              Tu pedido <span className="font-semibold">#{pedidoID}</span> fue registrado con éxito.
            </p>

            <button
              className="mt-6 bg-red-600 hover:bg-red-700 text-white py-2 w-full rounded-lg font-semibold"
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/b2b/pedidos");
              }}
            >
              Ver mis pedidos
            </button>

          </div>
        </div>
      )}

    </div>
  );
};

export default CarritoB2B;
