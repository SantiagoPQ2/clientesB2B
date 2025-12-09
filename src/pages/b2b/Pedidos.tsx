import React, { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import { useAuth } from "../../context/AuthContext";

interface Pedido {
  id: string;
  total: number;
  created_at: string;
  estado?: string;
  cliente_id?: string;
}

interface Item {
  id: string;
  pedido_id: string;
  nombre: string;
  articulo: string; // ⭐ ahora mostramos el código
  cantidad: number;
  subtotal: number;
}

const PedidosB2B: React.FC = () => {
  const { user } = useAuth();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    if (user) cargarPedidos();
  }, [user]);

  /* ============================================
        CARGAR PEDIDOS SEGÚN ROL
  ============================================ */
  const cargarPedidos = async () => {
    let query = supabase.from("z_pedidos").select("*");

    if (user?.role !== "admin") {
      query = query.eq("cliente_id", user?.id);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setPedidos((data as Pedido[]) || []);
  };

  /* ============================================
        CARGAR ITEMS DEL PEDIDO
  ============================================ */
  const cargarItems = async (pedidoId: string) => {
    setSelected((prev) => (prev === pedidoId ? "" : pedidoId));

    const { data, error } = await supabase
      .from("z_pedido_items")
      .select("*")
      .eq("pedido_id", pedidoId);

    if (error) {
      console.error(error);
      return;
    }

    setItems((data as Item[]) || []);
  };

  const itemsDePedido = (pedidoId: string) =>
    items.filter((i) => i.pedido_id === pedidoId);

  /* ============================================
        ADMIN CAMBIAR ESTADO
  ============================================ */
  const actualizarEstado = async (pedidoId: string, nuevoEstado: string) => {
    const { error } = await supabase
      .from("z_pedidos")
      .update({ estado: nuevoEstado })
      .eq("id", pedidoId);

    if (error) {
      console.error("Error actualizando estado:", error);
      return;
    }

    // actualizar localmente
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedidoId ? { ...p, estado: nuevoEstado } : p
      )
    );
  };

  /* ============================================
        UI
  ============================================ */
  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* ✨ Se SACÓ el título y descripción rígida */}

        {pedidos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            Todavía no hay pedidos registrados.
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((p) => {
              const fecha = p.created_at
                ? new Date(p.created_at).toLocaleString("es-AR")
                : "";

              const isSelected = selected === p.id;
              const detalle = itemsDePedido(p.id);

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-xl border shadow-sm p-4 sm:p-5 transition ${
                    isSelected ? "border-red-400 shadow-md" : "border-gray-100"
                  }`}
                >
                  {/* HEADER DEL PEDIDO */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="text-xs text-gray-400 uppercase">
                        Pedido
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          #{p.id.slice(0, 8)}
                        </span>

                        {/* ⭐ ESTADO DEL PEDIDO */}
                        {user?.role === "admin" ? (
                          <select
                            value={p.estado || "pendiente"}
                            onChange={(e) =>
                              actualizarEstado(p.id, e.target.value)
                            }
                            className="text-[11px] px-2 py-0.5 rounded-full border text-gray-700 bg-white"
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

                      <div className="text-xs text-gray-500 mt-1">{fecha}</div>
                    </div>

                    {/* TOTAL */}
                    <div className="text-right">
                      <div className="text-xs text-gray-400 uppercase">
                        Total
                      </div>
                      <div className="text-lg font-bold text-red-600">
                        $
                        {p.total?.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </div>

                  {/* BOTÓN VER DETALLE */}
                  <div className="mt-3">
                    <button
                      onClick={() => cargarItems(p.id)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      {isSelected ? "Ocultar detalle" : "Ver detalle"}
                    </button>
                  </div>

                  {/* DETALLE */}
                  {isSelected && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      {detalle.length === 0 ? (
                        <p className="text-xs text-gray-400">
                          Cargando detalle...
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {detalle.map((i) => (
                            <div
                              key={i.id}
                              className="flex justify-between text-xs text-gray-700"
                            >
                              <span>
                                <span className="font-semibold">
                                  {i.articulo}
                                </span>{" "}
                                - {i.nombre}{" "}
                                <span className="text-gray-500">
                                  x{i.cantidad}
                                </span>
                              </span>

                              <span className="font-semibold">
                                $
                                {i.subtotal?.toLocaleString("es-AR", {
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
