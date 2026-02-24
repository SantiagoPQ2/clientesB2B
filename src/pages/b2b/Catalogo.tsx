import React, { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import CarritoSidePanel from "../../components/CarritoSidePanel";
import ProductoModal from "../../components/ProductoModal";
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
  catalogo?: string | null;
}

const CatalogoB2B: React.FC = () => {
  const { user } = useAuth();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [filtroMarca, setFiltroMarca] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState<Record<string, number>>({});
  const [categoriaActiva, setCategoriaActiva] = useState<string>("");

  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);

  const { categoriaObjetivo, productoObjetivo, clearTargets } =
    useProductModal();

  // =========================
  // CARGA INICIAL
  // =========================
  useEffect(() => {
    cargarCarrito();
  }, []);

  useEffect(() => {
    cargarProductos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.catalogo]);

  const cargarCarrito = () => {
    const data = localStorage.getItem("carrito_b2b");
    if (data) setCarrito(JSON.parse(data));
  };

  const guardarCarrito = (nuevo: Record<string, number>) => {
    setCarrito(nuevo);
    localStorage.setItem("carrito_b2b", JSON.stringify(nuevo));
  };

  const cargarProductos = async () => {
    const catalogoCliente = String(user?.catalogo || "").toUpperCase().trim();

    // Si el cliente no tiene catálogo asignado, no mostramos nada (evita confusión)
    if (!catalogoCliente) {
      setProductos([]);
      return;
    }

    const { data, error } = await supabase
      .from("z_productos")
      .select("*")
      .eq("activo", true)
      // ilike sin % => case-insensitive exact match
      .ilike("catalogo", catalogoCliente)
      .gte("stock", 50);

    if (error) return console.error(error);

    const all = (data as Producto[]) || [];
    const sinCombos = all.filter(
      (p) => !p.combo || !String(p.combo).toLowerCase().includes("combo")
    );

    setProductos(sinCombos);
  };

  // =========================
  // AUTO ABRIR DESDE SEARCH
  // =========================
  useEffect(() => {
    if (!categoriaObjetivo || !productoObjetivo) return;

    setCategoriaActiva(categoriaObjetivo);

    const t = setTimeout(() => {
      setProductoSeleccionado(productoObjetivo);
      clearTargets();
    }, 350);

    return () => clearTimeout(t);
  }, [categoriaObjetivo, productoObjetivo, clearTargets]);

  // =========================
  // HELPERS CARRITO
  // =========================
  const cambiarCantidad = (id: string, nueva: number, stock: number) => {
    if (nueva <= 0) {
      const copia = { ...carrito };
      delete copia[id];
      guardarCarrito(copia);
      return;
    }

    guardarCarrito({
      ...carrito,
      [id]: Math.min(nueva, stock),
    });
  };

  const agregarUno = (id: string, stock: number) => {
    const actual = carrito[id] || 0;
    cambiarCantidad(id, actual + 1, stock);
  };

  // =========================
  // FILTROS
  // =========================
  const categorias = Array.from(
    new Set(productos.map((p) => p.categoria).filter(Boolean))
  );

  const marcas = Array.from(
    new Set(
      productos
        .filter((p) =>
          categoriaActiva ? p.categoria === categoriaActiva : true
        )
        .map((p) => p.marca)
        .filter(Boolean)
    )
  );

  const filtrados =
    categoriaActiva === ""
      ? []
      : productos.filter(
          (p) =>
            p.categoria === categoriaActiva &&
            (filtroMarca ? p.marca === filtroMarca : true) &&
            (busqueda
              ? p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                p.articulo.toLowerCase().includes(busqueda.toLowerCase())
              : true)
        );

  const stockBadge = (stock: number) => {
    // stock < 50 ya no aparece
    if (stock >= 500) return { txt: "Stock alto", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (stock >= 150) return { txt: "En stock", cls: "bg-green-50 text-green-700 border-green-200" };
    return { txt: "Stock limitado", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="w-full">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* ================= CATEGORÍAS ================= */}
          <div className="lg:col-span-3">
            {categoriaActiva === "" && (
              <div className="space-y-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900">
                      Elegí una categoría
                    </h2>
                    <p className="text-sm text-gray-500">
                      Mostramos solo productos de tu catálogo y con stock disponible.
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-600" />
                    VaFood B2B
                  </div>
                </div>

                {categorias.length === 0 ? (
                  <div className="bg-white rounded-2xl border shadow p-6 text-sm text-gray-500">
                    No hay productos disponibles para tu catálogo.
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {categorias.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCategoriaActiva(c)}
                        className="h-44 rounded-2xl bg-white vafood-shadow border border-gray-100
                                   flex items-center justify-center text-center px-4 text-2xl
                                   font-extrabold hover:shadow-xl hover:border-red-500/60
                                   transition-all duration-200 hover:-translate-y-0.5 animate-fadeIn"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= PRODUCTOS ================= */}
            {categoriaActiva !== "" && (
              <div className="flex flex-col gap-6">
                {/* FILTROS */}
                <div className="bg-white vafood-shadow rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-4 animate-fadeIn">
                  <input
                    placeholder="Nombre, código..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-200"
                  />

                  <select
                    value={filtroMarca}
                    onChange={(e) => setFiltroMarca(e.target.value)}
                    className="w-full sm:w-48 px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="">Todas</option>
                    {marcas.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      setCategoriaActiva("");
                      setFiltroMarca("");
                      setBusqueda("");
                    }}
                    className="text-sm text-red-600 font-semibold hover:text-red-700 transition"
                  >
                    ← Cambiar categoría
                  </button>
                </div>

                {/* GRID (3 por fila en desktop) */}
                <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {filtrados.map((p) => {
                    const qty = carrito[p.id] || 0;
                    const maxed = qty >= p.stock;

                    const badge = stockBadge(p.stock);

                    return (
                      <div
                        key={p.id}
                        className="group bg-white rounded-2xl vafood-shadow border border-gray-100 flex flex-col
                                   hover:shadow-xl hover:border-red-500/50 transition-all duration-200
                                   hover:-translate-y-0.5 cursor-pointer animate-fadeIn"
                        onClick={() => setProductoSeleccionado(p)}
                      >
                        {/* Imagen */}
                        <div className="relative h-44 bg-gray-50 flex items-center justify-center overflow-hidden rounded-t-2xl">
                          {/* Badge */}
                          <div
                            className={`absolute top-3 left-3 text-[11px] font-bold px-2 py-1 rounded-full border ${badge.cls}`}
                          >
                            {badge.txt}
                          </div>

                          {p.imagen_url ? (
                            <img
                              src={p.imagen_url}
                              alt={p.nombre}
                              className="max-h-full object-contain transition-transform duration-200 group-hover:scale-[1.04]"
                            />
                          ) : (
                            <div className="text-xs text-gray-400 text-center px-3">
                              Sin imagen
                              <div className="mt-1 text-[11px] text-gray-400">
                                {p.articulo}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 flex flex-col p-4">
                          <h3 className="text-base font-extrabold text-gray-900 leading-snug line-clamp-2">
                            {p.nombre}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {p.marca} · Código {p.articulo}
                          </p>

                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-xl font-extrabold text-red-600">
                              $
                              {p.precio.toLocaleString("es-AR", {
                                minimumFractionDigits: 2,
                              })}
                            </p>

                            <p className="text-[11px] text-gray-500">
                              Stock: <span className="font-semibold">{p.stock}</span>
                            </p>
                          </div>

                          {/* CONTROL CARRITO */}
                          <div
                            className="mt-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {qty === 0 ? (
                              <button
                                disabled={p.stock <= 0}
                                onClick={() => agregarUno(p.id, p.stock)}
                                className={`w-full px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition
                                  ${p.stock <= 0
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "vafood-gradient hover:opacity-[0.96] text-white"
                                  }`}
                              >
                                Agregar
                              </button>
                            ) : (
                              <div className="w-full inline-flex items-center justify-between rounded-lg border overflow-hidden">
                                <button
                                  onClick={() =>
                                    cambiarCantidad(p.id, qty - 1, p.stock)
                                  }
                                  className="w-12 py-2 text-sm font-extrabold hover:bg-gray-50 transition"
                                >
                                  −
                                </button>

                                <span className="px-3 text-sm font-extrabold text-gray-900">
                                  {qty}
                                </span>

                                <button
                                  disabled={maxed}
                                  onClick={() => agregarUno(p.id, p.stock)}
                                  className={`w-12 py-2 text-sm font-extrabold transition ${
                                    maxed
                                      ? "text-gray-300 cursor-not-allowed"
                                      : "hover:bg-red-50 text-red-700"
                                  }`}
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Micro copy motivacional */}
                          <p className="mt-3 text-[11px] text-gray-500">
                            Tip: combiná productos y aprovechá el{" "}
                            <span className="font-bold text-red-600">12% OFF</span> online.
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filtrados.length === 0 && (
                  <div className="bg-white rounded-2xl border shadow p-6 text-sm text-gray-500">
                    No hay productos para estos filtros.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ================= CARRITO ================= */}
          <div className="lg:col-span-1 lg:pl-6">
            <CarritoSidePanel
              carrito={carrito}
              secondaryLabel="Ver promociones"
              secondaryPath="/"
            />
          </div>
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {productoSeleccionado && (
        <ProductoModal
          producto={productoSeleccionado}
          cantidadInicial={carrito[productoSeleccionado.id] || 0}
          onClose={() => setProductoSeleccionado(null)}
          onConfirm={(cantidad) =>
            guardarCarrito({
              ...carrito,
              [productoSeleccionado.id]: cantidad,
            })
          }
        />
      )}
    </div>
  );
};

export default CatalogoB2B;
