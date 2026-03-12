import React, { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import { useAuth } from "../../context/AuthContext";
import * as XLSX from "xlsx";

interface Pedido {
  id: string;
  total: number;
  created_at: string;
  estado: string;
  cliente_id: string;
  cliente_username?: string;
  fecha_entrega?: string | null;
  porcentaje_descuento?: number | null;
}

interface Item {
  id: string;
  pedido_id: string;
  nombre: string;
  articulo: string;
  cantidad: number;
  subtotal: number;
  fecha_entrega?: string | null;
}

const ESTADOS: Record<
  string,
  { label: string; color: string }
> = {
  pendiente: {
    label: "Pendiente",
    color: "bg-red-100 text-red-700 border border-red-300",
  },
  en_proceso: {
    label: "En proceso",
    color: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  },
  entregado: {
    label: "Entregado",
    color: "bg-green-100 text-green-700 border border-green-300",
  },
};

const PedidosB2B: React.FC = () => {
  const { user } = useAuth();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  useEffect(() => {
    if (user) cargarPedidos();
  }, [user]);

  // ============================================================
  // CARGAR PEDIDOS
  // ============================================================
  const cargarPedidos = async () => {
    if (!user) return;

    let query = supabase.from("z_pedidos").select("*");

    if (user.role !== "admin") {
      query = query.eq("cliente_id", user.id);
    }

    const { data: pedidosBase, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error cargando pedidos:", error);
      return;
    }

    const { data: clientes } = await supabase
      .from("clientes_app")
      .select("id, username");

    const pedidosFinal =
      pedidosBase?.map((p) => {
        const cliente = clientes?.find((c) => c.id === p.cliente_id);
        return {
          ...p,
          cliente_username: p.cliente_username || cliente?.username || "—",
        };
      }) || [];

    setPedidos(pedidosFinal);
  };

  // ============================================================
  // CARGAR ITEMS
  // ============================================================
  const cargarItems = async (pedidoId: string) => {
    if (selected === pedidoId) {
      setSelected("");
      return;
    }

    setSelected(pedidoId);

    const { data, error } = await supabase
      .from("z_pedido_items")
      .select("*")
      .eq("pedido_id", pedidoId);

    if (error) {
      console.error("Error cargando items:", error);
      setItems([]);
      return;
    }

    setItems((data as Item[]) || []);
  };

  const itemsDePedido = (pedidoId: string) =>
    items.filter((i) => i.pedido_id === pedidoId);

  // ============================================================
  // CAMBIAR ESTADO (solo admin)
  // ============================================================
  const actualizarEstado = async (pedidoId: string, nuevoEstado: string) => {
    const { error } = await supabase
      .from("z_pedidos")
      .update({ estado: nuevoEstado })
      .eq("id", pedidoId);

    if (error) {
      console.error("Error actualizando estado:", error);
      return;
    }

    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedidoId ? { ...p, estado: nuevoEstado } : p
      )
    );
  };

  // ============================================================
  // ELIMINAR PEDIDO (cliente solo 8 hs y pendiente)
  // ============================================================
  const puedeEliminarPedido = (pedido: Pedido) => {
    if (!user) return false;
    if (user.role === "admin") return false;
    if (pedido.estado !== "pendiente") return false;

    const creado = new Date(pedido.created_at).getTime();
    const ahora = Date.now();
    const ochoHoras = 8 * 60 * 60 * 1000;

    return ahora - creado <= ochoHoras;
  };

  const horasRestantesEliminar = (pedido: Pedido) => {
    const creado = new Date(pedido.created_at).getTime();
    const ahora = Date.now();
    const ochoHoras = 8 * 60 * 60 * 1000;
    const restante = ochoHoras - (ahora - creado);

    if (restante <= 0) return "0h 0m";

    const horas = Math.floor(restante / (1000 * 60 * 60));
    const minutos = Math.floor(
      (restante % (1000 * 60 * 60)) / (1000 * 60)
    );

    return `${horas}h ${minutos}m`;
  };

  const eliminarPedido = async (pedido: Pedido) => {
    if (!puedeEliminarPedido(pedido)) return;

    const ok = window.confirm(
      "¿Querés eliminar este pedido? Esta acción no se puede deshacer."
    );
    if (!ok) return;

    try {
      setEliminandoId(pedido.id);

      const { error: errorItems } = await supabase
        .from("z_pedido_items")
        .delete()
        .eq("pedido_id", pedido.id);

      if (errorItems) {
        console.error("Error eliminando items:", errorItems);
        setEliminandoId(null);
        return;
      }

      const { error: errorPedido } = await supabase
        .from("z_pedidos")
        .delete()
        .eq("id", pedido.id);

      if (errorPedido) {
        console.error("Error eliminando pedido:", errorPedido);
        setEliminandoId(null);
        return;
      }

      setPedidos((prev) => prev.filter((p) => p.id !== pedido.id));
      setItems((prev) => prev.filter((i) => i.pedido_id !== pedido.id));

      if (selected === pedido.id) {
        setSelected("");
      }

      setEliminandoId(null);
    } catch (e) {
      console.error("Error eliminando pedido:", e);
      setEliminandoId(null);
    }
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
    const rows: any[] = [];

    for (const p of pedidosFiltrados) {
      const { data: detalle, error } = await supabase
        .from("z_pedido_items")
        .select("*")
        .eq("pedido_id", p.id);

      if (error) {
        console.error("Error exportando detalle:", error);
        continue;
      }

      detalle?.forEach((i) => {
        rows.push({
          cliente: p.cliente_username,
          articulo: i.articulo,
          cantidad: i.cantidad,
          subtotal: i.subtotal,
          estado: p.estado,
          fecha: new Date(p.created_at).toLocaleString("es-AR"),
          fecha_entrega: p.fecha_entrega
            ? new Date(p.fecha_entrega).toLocaleDateString("es-AR")
            : "",
          descuento: p.porcentaje_descuento ?? 0,
        });
      });
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");

    XLSX.writeFile(wb, "pedidos.xlsx");
  };

  return (
    <div className="w-full">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* FILTROS */}
        <div className="flex justify-between mb-5 gap-3 flex-wrap">
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
              const estadoKey = p.estado || "pendiente";
              const estadoVisual = ESTADOS[estadoKey] || ESTADOS.pendiente;
              const puedeEliminar = puedeEliminarPedido(p);

              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-xl border shadow-sm p-5 transition ${
                    isSelected ? "border-red-400" : "border-gray-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                    {/* IZQUIERDA */}
                    <div>
                      <p className="text-xs text-gray-400">PEDIDO</p>

                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold">#{p.id.slice(0, 8)}</span>

                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${estadoVisual.color}`}
                        >
                          {estadoVisual.label}
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

                      {p.fecha_entrega && (
                        <p className="text-xs text-gray-500 mt-1">
                          Entrega estimada:{" "}
                          <b>
                            {new Date(p.fecha_entrega).toLocaleDateString(
                              "es-AR",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }
                            )}
                          </b>
                        </p>
                      )}

                      {typeof p.porcentaje_descuento === "number" && (
                        <p className="text-xs text-emerald-700 mt-1 font-semibold">
                          Descuento aplicado: {p.porcentaje_descuento}%
                        </p>
                      )}

                      {puedeEliminar && (
                        <p className="text-[11px] text-amber-600 mt-2 font-medium">
                          Podés eliminar este pedido durante {horasRestantesEliminar(p)} más.
                        </p>
                      )}
                    </div>

                    {/* DERECHA */}
                    <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase">TOTAL</p>
                      <p className="text-lg font-bold text-red-600">
                        $
                        {Number(p.total || 0).toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* ACCIONES */}
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <button
                      onClick={() => cargarItems(p.id)}
                      className="text-xs text-red-600"
                    >
                      {isSelected ? "Ocultar detalle" : "Ver detalle"}
                    </button>

                    {puedeEliminar && (
                      <button
                        onClick={() => eliminarPedido(p)}
                        disabled={eliminandoId === p.id}
                        className="text-xs text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg px-3 py-1 font-semibold transition disabled:opacity-60"
                      >
                        {eliminandoId === p.id
                          ? "Eliminando..."
                          : "Eliminar pedido"}
                      </button>
                    )}
                  </div>

                  {/* DETALLE */}
                  {isSelected && (
                    <div className="mt-3 border-t pt-3">
                      {detalle.length === 0 ? (
                        <p className="text-xs text-gray-400">Cargando...</p>
                      ) : (
                        detalle.map((i) => (
                          <div
                            key={i.id}
                            className="flex justify-between text-xs text-gray-700 mb-1 gap-4"
                          >
                            <span>
                              <b>{i.articulo}</b> — {i.nombre}{" "}
                              <span className="text-gray-500">x{i.cantidad}</span>
                            </span>

                            <span className="font-semibold whitespace-nowrap">
                              $
                              {Number(i.subtotal || 0).toLocaleString("es-AR", {
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
