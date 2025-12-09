import React, { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import { useAuth } from "../../context/AuthContext";
import * as XLSX from "xlsx";

interface Pedido {
  id: string;
  total: number;
  created_at: string;
  estado: string;
  cliente_id: string;           // UUID
  cliente_username?: string;    // username real
}

interface Item {
  id: string;
  pedido_id: string;
  nombre: string;
  articulo: string;
  cantidad: number;
  subtotal: number;
}

const ESTADOS = {
  pendiente: { label: "Pendiente", color: "bg-red-100 text-red-700 border border-red-300" },
  en_proceso: { label: "En proceso", color: "bg-yellow-100 text-yellow-700 border border-yellow-300" },
  entregado: { label: "Entregado", color: "bg-green-100 text-green-700 border border-green-300" },
};

const PedidosB2B: React.FC = () => {
  const { user } = useAuth();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  useEffect(() => {
    if (user) cargarPedidos();
  }, [user]);

  // ============================================================
  // CARGAR PEDIDOS (con username asociado)
  // ============================================================
  const cargarPedidos = async () => {
    if (!user) return;

    let query = supabase.from("z_pedidos").select("*");

    if (user.role !== "admin") {
      // ⭐ FILTRA USANDO UUID
      query = query.eq("cliente_id", user.id);
    }

    const { data: pedidosBase, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error cargando pedidos:", error);
      return;
    }

    // Obtener lista de clientes para traer su username
    const { data: clientes } = await supabase
      .from("clientes_app")
      .select("id, username");

    // Unificar info
    const pedidosFinal = pedidosBase?.map((p) => {
      const cliente = clientes?.find((c) => c.id === p.cliente_id);
      return {
        ...p,
        cliente_username: cliente?.username ?? "—",
      };
    });

    setPedidos(pedidosFinal || []);
  };

  // ============================================================
  // CARGAR ITEMS
  // ============================================================
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

  // ============================================================
  // CAMBIAR ESTADO (solo admin)
  // ============================================================
  const actualizarEstado = async (pedidoId: string, nuevoEstado: string) => {
    await supabase.from("z_pedidos").update({ estado: nuevoEstado }).eq("id", pedidoId);

    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedidoId ? { ...p, estado: nuevoEstado } : p
      )
    );
  };

  // ============================================================
  // FILTRADO
  // ============================================================
  const pedidosFiltrados =
    filtroEstado === "todos"
      ? pedidos
      : pedidos.filter((p) => p.estado === filtroEstado);

  // ============================================================
  // EXPORTAR A EXCEL
  // ============================================================
  const exportarExcel = async () => {
    let rows: any[] = [];

    for (const p of pedidosFiltrados) {
      const { data: detalle } = await supabase
        .from("z_pedido_items")
        .select("*")
        .eq("pedido_id", p.id);

      detalle?.forEach((i) => {
        rows.push({
          cliente: p.cliente_username,   // ⭐ Username real
          articulo: i.articulo,
          cantidad: i.cantidad,
          subtotal: i.subtotal,
          estado: p.estado,
          fecha: new Date(p.created_at).toLocaleString("es-AR"),
        });
      });
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");

    XLSX.writeFile(wb, "pedidos.xlsx");
  };

  // ============================================================
  // UI
  // ============================================================
  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* FILTROS */}
        <div className="flex justify-between mb-5">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 border rounded-lg shadow-sm"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En proceso</option>
            <option value="entregado">Entregado</option>
          </select>

          <button
            onClick={exportarExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
          >
            Exportar Excel
          </button>
        </div>

        {/* LISTA DE PEDIDOS */}
        {pedidosFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
            No hay pedidos disponibles.
          </div>
        ) : (
          <div className="space-y-4">
            {pedidosFiltrados.map((p) => {
              const fecha = new Date(p.created_at).toLocaleString("es-AR");
              const detalle = itemsDePedido(p.id);
              const isSelected = selected === p.id;

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-xl border shadow-sm p-5 transition ${
                    isSelected ? "border-red-400" : "border-gray-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between">

                    {/* IZQUIERDA */}
                    <div>
                      <p className="text-xs text-gray-400">PEDIDO</p>

                      <div className="flex items-center gap-3">
                        <span className="font-bold">#{p.id.slice(0, 8)}</span>

                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            ESTADOS[p.estado || "pendiente"].color
                          }`}
                        >
                          {ESTADOS[p.estado || "pendiente"].label}
                        </span>

                        {user?.role === "admin" && (
                          <select
                            className="border text-xs rounded px-2 py-1"
                            value={p.estado}
                            onChange={(e) =>
                              actualizarEstado(p.id, e.target.value)
                            }
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="en_proceso">En proceso</option>
                            <option value="entregado">Entregado</option>
                          </select>
                        )}
                      </div>

                      <p className="text-xs text-gray-700 mt-1">
                        Cliente: <b>{p.cliente_username}</b>
                      </p>

                      <p className="text-xs text-gray-500">{fecha}</p>
                    </div>

                    {/* DERECHA */}
                    <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase">TOTAL</p>
                      <p className="text-lg font-bold text-red-600">
                        {p.total.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* DETALLE */}
                  <button
                    onClick={() => cargarItems(p.id)}
                    className="text-xs text-red-600 mt-3"
                  >
                    {isSelected ? "Ocultar detalle" : "Ver detalle"}
                  </button>

                  {isSelected && (
                    <div className="mt-3 border-t pt-3">
                      {detalle.length === 0 ? (
                        <p className="text-xs text-gray-400">Cargando...</p>
                      ) : (
                        detalle.map((i) => (
                          <div key={i.id} className="flex justify-between text-xs text-gray-700 mb-1">
                            <span>
                              <b>{i.articulo}</b> — {i.nombre}{" "}
                              <span className="text-gray-500">x{i.cantidad}</span>
                            </span>

                            <span className="font-semibold">
                              $
                              {i.subtotal.toLocaleString("es-AR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        ))
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
