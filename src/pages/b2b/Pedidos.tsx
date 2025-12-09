import React, { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import { useAuth } from "../../context/AuthContext";

interface Pedido {
  id: string;
  total: number;
  created_at: string;
  estado?: string;
  cliente?: { username: string }; // ⭐ username del cliente
}

interface Item {
  id: string;
  pedido_id: string;
  nombre: string;
  articulo: string;
  cantidad: number;
  subtotal: number;
}

const PedidosB2B: React.FC = () => {
  const { user } = useAuth();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (user) cargarPedidos();
  }, [user]);

  // =====================================================
  // 🔹 CARGAR PEDIDOS SEGÚN ROL + JOIN CON clientes_app
  // =====================================================
  const cargarPedidos = async () => {
    let query = supabase
      .from("z_pedidos")
      .select("*, cliente:clientes_app(username)") // ⭐ JOIN
      .order("created_at", { ascending: false });

    // Cliente solo ve sus pedidos
    if (user?.role !== "admin") {
      query = query.eq("cliente_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error cargando pedidos:", error);
      return;
    }

    setPedidos((data as Pedido[]) || []);
  };

  // =====================================================
  // 🔹 CARGAR ITEMS
  // =====================================================
  const cargarItems = async (pedidoId: string) => {
    setSelected((prev) => (prev === pedidoId ? "" : pedidoId));

    const { data } = await supabase
      .from("z_pedido_items")
      .select("*")
      .eq("pedido_id", pedidoId);

    setItems((data as Item[]) || []);
  };

  const itemsDePedido = (pedidoId: string) =>
    items.filter((i) => i.pedido_id === pedidoId);

  // =====================================================
  // 🔹 ADMIN CAMBIA EL ESTADO DEL PEDIDO
  // =====================================================
  const actualizarEstado = async (pedidoId: string, nuevoEstado: string) => {
    await supabase
      .from("z_pedidos")
      .update({ estado: nuevoEstado })
      .eq("id", pedidoId);

    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedidoId ? { ...p, estado: nuevoEstado } : p
      )
    );
  };

  // =====================================================
  // 🔹 UI
  // =====================================================
  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto px-4 py-6">

        {pedidos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            Todavía no hay pedidos registrados.
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((p) => {
              const fecha = new Date(p.created_at).toLocaleString("es-AR");
              const detalle = itemsDePedido(p.id);
              const isSelected = selected === p.id;

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-xl border shadow-sm p-5 transition ${
                    isSelected ? "border-red-400 shadow-md" : "border-gray-100"
                  }`}
                >
                  {/* HEADER DEL PEDIDO */}
                  <div className="flex flex-col sm:flex-row sm:justify-between">

                    <div>
                      <p className="text-xs text-gray-400 uppercase">PEDIDO</p>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">
                          #{p.id.slice(0, 8)}
                        </span>

                        {/* ⭐ ESTADO (ADMIN EDITA, CLIENTE SOLO VE) */}
                        {user?.role === "admin" ? (
                          <select
                            value={p.estado || "pendiente"}
                            onChange={(e) =>
                              actualizarEstado(p.id, e.target.value)
                            }
                            className="text-xs border rounded px-2 py-1"
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="en_proceso">En proceso</option>
                            <option value="entregado">Entregado</option>
                          </select>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold">
                            {p.estado || "Pendiente"}
                          </span>
                        )}
                      </div>

                      {/* ⭐ USERNAME DEL CLIENTE */}
                      <p className="text-xs text-gray-600 mt-1">
                        Cliente:{" "}
                        <span className="font-semibold text-gray-800">
                          {p.cliente?.username || "—"}
                        </span>
                      </p>

                      <p className="text-xs text-gray-500">{fecha}</p>
                    </div>

                    {/* TOTAL */}
                    <div className="text-right mt-3 sm:mt-0">
                      <p className="text-xs text-gray-400 uppercase">TOTAL</p>
                      <p className="text-lg font-bold text-red-600">
                        $
                        {p.total.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* BOTÓN DETALLE */}
                  <button
                    onClick={() => cargarItems(p.id)}
                    className="text-xs text-red-600 font-semibold mt-3"
                  >
                    {isSelected ? "Ocultar detalle" : "Ver detalle"}
                  </button>

                  {/* DETALLE */}
                  {isSelected && (
                    <div className="mt-3 border-t pt-3">
                      {detalle.length === 0 ? (
                        <p className="text-xs text-gray-400">Cargando...</p>
                      ) : (
                        <div className="space-y-2">
                          {detalle.map((i) => (
                            <div
                              key={i.id}
                              className="flex justify-between text-xs text-gray-700"
                            >
                              <span>
                                <strong>{i.articulo}</strong> — {i.nombre}{" "}
                                <span className="text-gray-500">
                                  x{i.cantidad}
                                </span>
                              </span>

                              <span className="font-semibold">
                                $
                                {i.subtotal.toLocaleString("es-AR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PedidosB2B;
