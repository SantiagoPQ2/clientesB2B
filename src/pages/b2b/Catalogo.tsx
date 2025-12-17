import React, { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import CarritoSidePanel from "../../components/CarritoSidePanel";
import ProductoModal from "../../components/ProductoModal";
import { useProductModal } from "../../context/ProductModalContext";

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

  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);

  const { categoriaObjetivo, productoObjetivo, clearTargets } =
    useProductModal();

  // =========================
  // CARGA INICIAL
  // =========================
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
  }, [categoriaObjetivo, productoObjetivo]);

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
              <div className="grid gap-10 sm:grid-cols-2">
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
            )}

            {/* ================= PRODUCTOS ================= */}
            {categoriaActiva !== "" && (
              <div className="flex flex-col gap-6">
                {/* FILTROS */}
                <div className="bg-white shadow-md rounded-xl border p-4 flex flex-col sm:flex-row gap-4">
                  <input
                    placeholder="Nombre, código..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  />

                  <select
                    value={filtroMarca}
                    onChange={(e) => setFiltroMarca(e.target.value)}
                    className="w-40 px-3 py-2 border rounded-lg text-sm bg-white"
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
                    className="text-sm text-red-600 font-semibold"
                  >
                    ← Cambiar categoría
                  </button>
                </div>

                {/* GRID */}
                <div className="grid gap-8 grid-cols-1 sm:grid-cols-2">
                  {filtrados.map((p) => {
                    const qty = carrito[p.id] || 0;
                    const maxed = qty >= p.stock;

                    return (
                      <div
                        key={p.id}
                        className="bg-white rounded-xl shadow-md border flex flex-col 
                                   hover:shadow-lg transition cursor-pointer"
                        onClick={() => setProductoSeleccionado(p)}
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
                            <div className="text-xs text-gray-400">
                              Sin imagen
                            </div>
                          )}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 flex flex-col p-4">
                          <h3 className="text-lg font-semibold">
                            {p.nombre}
                          </h3>
                          <p className="text-xs text-gray-500">{p.marca}</p>

                          <div className="mt-auto flex items-center justify-between">
                            <p className="text-xl font-bold text-red-600">
                              $
                              {p.precio.toLocaleString("es-AR", {
                                minimumFractionDigits: 2,
                              })}
                            </p>

                            {/* CONTROL CARRITO */}
                            <div onClick={(e) => e.stopPropagation()}>
                              {qty === 0 ? (
                                <button
                                  disabled={p.stock <= 0}
                                  onClick={() =>
                                    agregarUno(p.id, p.stock)
                                  }
                                  className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold"
                                >
                                  Agregar
                                </button>
                              ) : (
                                <div className="inline-flex items-center rounded-lg border overflow-hidden">
                                  <button
                                    onClick={() =>
                                      cambiarCantidad(
                                        p.id,
                                        qty - 1,
                                        p.stock
                                      )
                                    }
                                    className="px-3 py-1.5 text-sm"
                                  >
                                    −
                                  </button>

                                  <span className="px-3 text-sm font-semibold">
                                    {qty}
                                  </span>

                                  <button
                                    disabled={maxed}
                                    onClick={() =>
                                      agregarUno(p.id, p.stock)
                                    }
                                    className={`px-3 py-1.5 text-sm ${
                                      maxed
                                        ? "text-gray-300"
                                        : ""
                                    }`}
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
