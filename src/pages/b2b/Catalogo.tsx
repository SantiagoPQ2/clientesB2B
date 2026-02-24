import React, { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import { useAuth } from "../../context/AuthContext";
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

    // Si el cliente no tiene catálogo asignado, no mostramos productos
    if (!catalogoCliente) {
      setProductos([]);
      return;
    }

    const { data, error } = await supabase
      .from("z_productos")
      .select("*")
      .eq("activo", true)
      .eq("catalogo", catalogoCliente)
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
              <div className="bg-white rounded-xl shadow border p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Catálogo
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Seleccioná una categoría para ver los productos disponibles.
                </p>

                {categorias.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No hay productos disponibles para tu catálogo.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {categorias.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setCategoriaActiva(c);
                          setFiltroMarca("");
                          setBusqueda("");
                        }}
                        className="p-3 bg-gray-50 hover:bg-gray-100 border rounded-lg text-sm font-semibold text-gray-800 text-left"
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
              <div className="space-y-4">
                {/* HEADER */}
                <div className="bg-white rounded-xl shadow border p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setCategoriaActiva("");
                        setFiltroMarca("");
                        setBusqueda("");
                      }}
                      className="text-sm font-semibold text-gray-600 hover:text-gray-900"
                    >
                      ← Volver
                    </button>
                    <h2 className="text-lg font-bold text-gray-900">
                      {categoriaActiva}
                    </h2>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                    <input
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar por nombre o código..."
                      className="border rounded-lg px-3 py-2 text-sm w-full sm:w-72"
                    />

                    <select
                      value={filtroMarca}
                      onChange={(e) => setFiltroMarca(e.target.value)}
                      className="border rounded-lg px-3 py-2 text-sm w-full sm:w-56"
                    >
                      <option value="">Todas las marcas</option>
                      {marcas.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* LISTA */}
                {filtrados.length === 0 ? (
                  <div className="bg-white rounded-xl shadow border p-6 text-sm text-gray-500">
                    No hay productos disponibles para los filtros seleccionados.
                  </div>
                ) : (
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filtrados.map((p) => {
                      const qty = carrito[p.id] || 0;
                      const maxed = p.stock > 0 && qty >= p.stock;

                      return (
                        <div
                          key={p.id}
                          className="bg-white rounded-xl border shadow-md hover:shadow-lg transition overflow-hidden flex flex-col"
                        >
                          <div
                            className="cursor-pointer"
                            onClick={() => setProductoSeleccionado(p)}
                          >
                            <div className="h-52 bg-gray-50 flex items-center justify-center">
                              {p.imagen_url ? (
                                <img
                                  src={p.imagen_url}
                                  alt={p.nombre}
                                  className="max-h-full object-contain"
                                />
                              ) : (
                                <div className="text-gray-400 text-xs text-center px-2">
                                  Sin imagen <br /> {p.articulo}
                                </div>
                              )}
                            </div>

                            <div className="p-4">
                              <p className="text-sm font-bold text-gray-900 line-clamp-2">
                                {p.nombre}
                              </p>
                              <p className="text-xs text-gray-500">
                                Código: {p.articulo}
                              </p>

                              <div className="mt-2 flex items-center justify-between">
                                <p className="text-sm font-extrabold text-gray-900">
                                  $
                                  {Number(p.precio || 0).toLocaleString(
                                    "es-AR"
                                  )}
                                </p>
                                <p className="text-[11px] text-gray-500">
                                  Stock: {p.stock}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* CONTROLES */}
                          <div className="p-4 pt-0 mt-auto">
                            {qty <= 0 ? (
                              <button
                                onClick={() => agregarUno(p.id, p.stock)}
                                className="w-full bg-gray-900 hover:bg-black text-white rounded-lg py-2 text-sm font-semibold"
                              >
                                Agregar
                              </button>
                            ) : (
                              <div className="flex items-center justify-between gap-2">
                                <button
                                  onClick={() =>
                                    cambiarCantidad(p.id, qty - 1, p.stock)
                                  }
                                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-gray-800"
                                >
                                  -
                                </button>

                                <div className="text-sm font-bold text-gray-900">
                                  {qty}
                                </div>

                                <button
                                  onClick={() => agregarUno(p.id, p.stock)}
                                  disabled={maxed}
                                  className={`w-10 h-10 rounded-lg font-bold ${
                                    maxed
                                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                      : "bg-gray-900 hover:bg-black text-white"
                                  }`}
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ================= CARRITO LATERAL ================= */}
          <CarritoSidePanel
            carrito={carrito}
            secondaryLabel="Ver promociones"
            secondaryPath="/"
          />
        </div>
      </div>

      {/* MODAL PRODUCTO */}
      {productoSeleccionado && (
        <ProductoModal
          producto={productoSeleccionado}
          onClose={() => setProductoSeleccionado(null)}
          carrito={carrito}
          cambiarCantidad={cambiarCantidad}
          agregarUno={agregarUno}
        />
      )}
    </div>
  );
};

export default CatalogoB2B;
