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

    const sinCombos = all.filter((p) => {
      if (!p.combo) return true;
      return !String(p.combo).toLowerCase().includes("combo");
    });

    setProductos(sinCombos);
  };

  const cambiarCantidad = (id: string, cantidad: number, stock?: number) => {
    let nueva = Math.floor(cantidad || 0);
    if (stock && stock > 0) nueva = Math.min(nueva, stock);
    if (nueva <= 0) {
      const copia = { ...carrito };
      delete copia[id];
      guardarCarrito(copia);
    } else {
      guardarCarrito({ ...carrito, [id]: nueva });
    }
  };

  const agregarUno = (id: string, stock?: number) => {
    const actual = carrito[id] || 0;
    const nueva = stock && stock > 0 ? Math.min(actual + 1, stock) : actual + 1;
    cambiarCantidad(id, nueva, stock);
  };

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

  return (
    <div className="w-full">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* ZONA PRINCIPAL */}
          <div className="lg:col-span-3">
            {/* CATEGORÍAS GRANDES */}
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

            {/* PRODUCTOS */}
            {categoriaActiva !== "" && (
              <div className="flex flex-col gap-6">
                {/* FILTROS */}
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

                {/* GRID PRODUCTOS */}
                <div>
                  {filtrados.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-8 bg-white rounded-xl shadow-sm">
                      No hay productos para mostrar.
                    </div>
                  ) : (
                    <div className="grid gap-8 grid-cols-1 sm:grid-cols-2">
                      {filtrados.map((p) => {
                        const qty = carrito[p.id] || 0;
                        const maxed = p.stock > 0 && qty >= p.stock;

                        return (
                          <div
                            key={p.id}
                            className="bg-white rounded-xl shadow-md border border-gray-100 
                                       flex flex-col overflow-hidden hover:shadow-lg transition-shadow"
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

                              <p className="text-xs text-gray-500 mt-1 mb-2">
                                {p.marca}
                              </p>

                              <div className="mt-auto flex items-center justify-between">
                                <div>
                                  <p className="text-[11px] text-gray-400 uppercase">
                                    Precio
                                  </p>
                                  <p className="text-xl font-bold text-red-600">
                                    $
                                    {p.precio.toLocaleString("es-AR", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </p>
                                </div>

                                {/* Botón / contador */}
                                {qty === 0 ? (
                                  <button
                                    disabled={p.stock <= 0}
                                    onClick={() => agregarUno(p.id, p.stock)}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition 
                                      ${
                                        p.stock <= 0
                                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                          : "bg-red-600 hover:bg-red-700 text-white"
                                      }`}
                                  >
                                    Agregar
                                  </button>
                                ) : (
                                  <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
                                    <button
                                      onClick={() =>
                                        cambiarCantidad(p.id, qty - 1, p.stock)
                                      }
                                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                                    >
                                      −
                                    </button>
                                    <input
                                      type="number"
                                      min={0}
                                      value={qty}
                                      onChange={(e) =>
                                        cambiarCantidad(
                                          p.id,
                                          Number(e.target.value),
                                          p.stock
                                        )
                                      }
                                      className="w-12 text-center text-sm font-semibold border-x border-gray-200 focus:outline-none"
                                    />
                                    <button
                                      onClick={() => agregarUno(p.id, p.stock)}
                                      disabled={maxed}
                                      className={`px-3 py-1.5 text-sm ${
                                        maxed
                                          ? "text-gray-300 cursor-not-allowed"
                                          : "text-gray-600 hover:bg-gray-100"
                                      }`}
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CARRITO LATERAL */}
          <div className="lg:col-span-1 lg:pl-6 xl:pl-10">
            <CarritoSidePanel
              carrito={carrito}
              secondaryLabel="Ver promociones"
              secondaryPath="/"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogoB2B;
