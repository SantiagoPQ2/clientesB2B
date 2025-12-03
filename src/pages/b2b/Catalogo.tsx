import React, { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import CarritoSidePanel from "../../components/CarritoSidePanel";

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

const CatalogoB2B: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filtroMarca, setFiltroMarca] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState<Record<string, number>>({});
  const [categoriaActiva, setCategoriaActiva] = useState<string>("");

  // Modal de producto
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidadModal, setCantidadModal] = useState<number>(0);

  // ===================== CARGA INICIAL =====================
  useEffect(() => {
    cargarProductos();
    cargarCarrito();
  }, []);

  const cargarCarrito = () => {
    const data = localStorage.getItem("carrito_b2b");
    if (data) setCarrito(JSON.parse(data));
  };

  const guardarCarrito = (nuevo: Record<string, number>) => {
    setCarrito(nuevo);
    localStorage.setItem("carrito_b2b", JSON.stringify(nuevo));
  };

  const cargarProductos = async () => {
    const { data, error } = await supabase
      .from("z_productos")
      .select("*")
      .eq("activo", true);

    if (error) {
      console.error("Error cargando productos:", error);
      return;
    }

    const all = (data as Producto[]) || [];

    // Sacamos los combos del catálogo
    const sinCombos = all.filter((p) => {
      if (!p.combo) return true;
      return !String(p.combo).toLowerCase().includes("combo");
    });

    setProductos(sinCombos);
  };

  // ===================== MODAL PRODUCTO =====================

  const abrirProducto = (p: Producto) => {
    const qtyActual = carrito[p.id] || 0;
    setProductoSeleccionado(p);
    setCantidadModal(qtyActual); // arranca con lo que ya tiene en carrito (o 0)
  };

  const cerrarModal = () => {
    setProductoSeleccionado(null);
  };

  const aplicarCantidadModal = () => {
    if (!productoSeleccionado) return;

    let nueva = Math.floor(cantidadModal || 0);
    if (nueva < 0) nueva = 0;

    const nuevoCarrito = { ...carrito };
    if (nueva === 0) {
      delete nuevoCarrito[productoSeleccionado.id];
    } else {
      // si querés que sea acumulativo en vez de reemplazar:
      // nueva = (carrito[productoSeleccionado.id] || 0) + nueva;
      nuevoCarrito[productoSeleccionado.id] = nueva;
    }

    guardarCarrito(nuevoCarrito);
    setProductoSeleccionado(null);
  };

  const cambiarCantidadModal = (delta: number) => {
    setCantidadModal((prev) => {
      const nueva = (prev || 0) + delta;
      return nueva < 0 ? 0 : nueva;
    });
  };

  // ===================== CATEGORÍAS / FILTROS =====================

  const categorias = Array.from(
    new Set(productos.map((p) => p.categoria).filter(Boolean))
  );

  const marcas = Array.from(
    new Set(
      productos
        .filter((p) => (categoriaActiva ? p.categoria === categoriaActiva : true))
        .map((p) => p.marca)
        .filter(Boolean)
    )
  );

  const filtrados =
    categoriaActiva === ""
      ? []
      : productos.filter((p) => {
          return (
            p.categoria === categoriaActiva &&
            (filtroMarca ? p.marca === filtroMarca : true) &&
            (busqueda
              ? p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                p.articulo.toLowerCase().includes(busqueda.toLowerCase())
              : true)
          );
        });

  // ===================== RENDER =====================

  return (
    <div className="w-full">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* =============== ZONA PRINCIPAL =============== */}
          <div className="lg:col-span-3">
            {/* ===================== CATEGORÍAS GRANDES ===================== */}
            {categoriaActiva === "" && (
              <div>
                <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-2">
                  {categorias.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategoriaActiva(c)}
                      className="h-52 rounded-2xl bg-white shadow-lg border border-gray-100 
                                 flex items-center justify-center text-center px-4 text-2xl 
                                 font-bold hover:shadow-2xl hover:border-red-500 transition"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ===================== PRODUCTOS ===================== */}
            {categoriaActiva !== "" && (
              <div className="flex flex-col gap-6">
                {/* FILTROS SUPERIORES */}
                <div className="bg-white w-full shadow-md rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-end gap-4">
                  {/* Buscar */}
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Buscar
                    </label>
                    <input
                      placeholder="Nombre, código..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm 
                        focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  {/* Marca */}
                  <div className="w-40">
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Marca
                    </label>
                    <select
                      value={filtroMarca}
                      onChange={(e) => setFiltroMarca(e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white 
                        focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Todas</option>
                      {marcas.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cambiar categoría */}
                  <button
                    onClick={() => {
                      setCategoriaActiva("");
                      setFiltroMarca("");
                      setBusqueda("");
                    }}
                    className="text-sm text-red-600 hover:text-red-700 font-semibold whitespace-nowrap"
                  >
                    ← Cambiar categoría
                  </button>
                </div>

                {/* GRID DE PRODUCTOS */}
                <div>
                  {filtrados.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-8 bg-white rounded-xl shadow-sm">
                      No hay productos para mostrar.
                    </div>
                  ) : (
                    <div className="grid gap-8 grid-cols-1 sm:grid-cols-2">
                      {filtrados.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => abrirProducto(p)}
                          className="bg-white rounded-xl shadow-md border border-gray-100 
                                     flex flex-col overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        >
                          {/* Imagen */}
                          <div className="h-44 bg-gray-50 flex items-center justify-center">
                            {p.imagen_url ? (
                              <img
                                src={p.imagen_url}
                                alt={p.nombre}
                                className="max-h-full object-contain"
                              />
                            ) : (
                              <div className="text-center px-4">
                                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                  Sin imagen
                                </div>
                                <div className="text-[10px] text-gray-400">
                                  Código: {p.articulo}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Contenido */}
                          <div className="flex-1 flex flex-col p-4">
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                              {p.nombre}
                            </h3>

                            <p className="text-xs text-gray-500 mt-1 mb-2">{p.marca}</p>

                            <div className="mt-auto flex items-center justify-between">
                              <div>
                                <p className="text-[11px] text-gray-400 uppercase">Precio</p>
                                <p className="text-xl font-bold text-red-600">
                                  $
                                  {p.precio.toLocaleString("es-AR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </p>
                              </div>

                              {/* Botón que también abre el modal (pero frenando el click de la card) */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirProducto(p);
                                }}
                                className="px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition 
                                           bg-red-600 hover:bg-red-700 text-white"
                              >
                                Agregar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* =============== CARRITO LATERAL =============== */}
          <div className="lg:col-span-1 lg:pl-6 xl:pl-10">
            <CarritoSidePanel
              carrito={carrito}
              secondaryLabel="Ver promociones"
              secondaryPath="/"
            />
          </div>
        </div>
      </div>

      {/* =============== MODAL DETALLE DE PRODUCTO =============== */}
      {productoSeleccionado && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl shadow-2xl w-[95%] max-w-xl p-6 sm:p-8 relative">

            {/* Cerrar */}
            <button
              onClick={cerrarModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Imagen grande */}
              <div className="bg-gray-50 rounded-xl flex items-center justify-center p-4">
                {productoSeleccionado.imagen_url ? (
                  <img
                    src={productoSeleccionado.imagen_url}
                    alt={productoSeleccionado.nombre}
                    className="max-h-56 object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-400 uppercase">
                      Sin imagen
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Código: {productoSeleccionado.articulo}
                    </p>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-gray-900">
                  {productoSeleccionado.nombre}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {productoSeleccionado.marca} • {productoSeleccionado.categoria}
                </p>

                <div className="mt-4">
                  <p className="text-[11px] text-gray-400 uppercase">Precio</p>
                  <p className="text-2xl font-bold text-red-600">
                    $
                    {productoSeleccionado.precio.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>

                {/* Cantidad */}
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 mb-1">
                    Cantidad
                  </p>
                  <div className="inline-flex items-center rounded-full border border-gray-200 overflow-hidden bg-white">
                    <button
                      onClick={() => cambiarCantidadModal(-1)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={cantidadModal}
                      onChange={(e) =>
                        setCantidadModal(
                          Number.isNaN(Number(e.target.value))
                            ? 0
                            : Math.max(0, Number(e.target.value))
                        )
                      }
                      className="w-14 text-center text-sm font-semibold border-x border-gray-200 focus:outline-none"
                    />
                    <button
                      onClick={() => cambiarCantidadModal(1)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Podés escribir directamente la cantidad que quieras.
                  </p>
                </div>

                {/* Botones */}
                <div className="mt-auto flex flex-col gap-2 pt-4">
                  <button
                    onClick={aplicarCantidadModal}
                    className="w-full py-2.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                  >
                    Confirmar cantidad y volver
                  </button>
                  <button
                    onClick={cerrarModal}
                    className="w-full py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogoB2B;
