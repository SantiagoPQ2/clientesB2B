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
  const [btnAnimacion, setBtnAnimacion] = useState<Record<string, boolean>>({});
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

  const agregarAlCarrito = (id: string) => {
    setBtnAnimacion((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setBtnAnimacion((prev) => ({ ...prev, [id]: false }));
    }, 300);

    const nuevo = { ...carrito, [id]: (carrito[id] || 0) + 1 };
    guardarCarrito(nuevo);
  };

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

        {/* GRID GENERAL */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

          {/* ZONA PRINCIPAL */}
          <div className="lg:col-span-3">

            {/* --- CATEGORÍAS --- */}
            {categoriaActiva === "" && (
              <div>
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-2">
                  {categorias.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategoriaActiva(c)}
                      className="h-40 rounded-2xl bg-white shadow-lg border border-gray-100 
                                 flex items-center justify-center text-center px-4 text-xl 
                                 font-bold hover:shadow-2xl hover:border-red-500 transition"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* --- PRODUCTOS --- */}
            {categoriaActiva !== "" && (
              <div className="flex flex-col gap-4">

                {/* Botón cambiar categoría */}
                <button
                  onClick={() => {
                    setCategoriaActiva("");
                    setFiltroMarca("");
                    setBusqueda("");
                  }}
                  className="text-xs text-red-600 hover:text-red-700 mb-1"
                >
                  ← Cambiar categoría
                </button>

                {/* FILTROS + PRODUCTOS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                  {/* FILTROS */}
                  <div className="md:col-span-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm h-fit">
                    <div className="mb-4">
                      <label className="text-xs font-semibold text-gray-500 uppercase">
                        Buscar
                      </label>
                      <input
                        placeholder="Nombre, código..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="mt-1 w-full px-3 py-2 mb-2 border border-gray-200 rounded-lg text-sm 
                        focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div className="mb-2">
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
                  </div>

                  {/* PRODUCTOS */}
                  <div className="md:col-span-3">
                    {filtrados.length === 0 ? (
                      <div className="text-center text-gray-500 text-sm py-8 bg-white rounded-xl shadow-sm">
                        No hay productos para mostrar.
                      </div>
                    ) : (
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                        {filtrados.map((p) => (
                          <div
                            key={p.id}
                            className="bg-white rounded-xl shadow-md border border-gray-100 
                                       flex flex-col overflow-hidden hover:shadow-lg transition-shadow"
                          >
                            {/* Imagen */}
                            <div className="h-40 bg-gray-50 flex items-center justify-center">
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
                              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                                {p.nombre}
                              </h3>

                              {/* Quitar marca/categoría si querés */}
                              <p className="text-xs text-gray-500 mt-1 mb-2">
                                {p.marca}
                              </p>

                              <div className="mt-auto flex items-center justify-between">
                                <div>
                                  <p className="text-[11px] text-gray-400 uppercase">Precio</p>
                                  <p className="text-lg font-bold text-red-600">
                                    ${p.precio.toLocaleString("es-AR", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </p>
                                </div>

                                <button
                                  disabled={p.stock <= 0}
                                  onClick={() => agregarAlCarrito(p.id)}
                                  className={`px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition 
                                    ${
                                      p.stock <= 0
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        : btnAnimacion[p.id]
                                        ? "bg-gray-300 text-gray-700 scale-105"
                                        : "bg-red-600 hover:bg-red-700 text-white"
                                    }`}
                                >
                                  {btnAnimacion[p.id] ? "Añadido ✔" : "Agregar"}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* --- CARRITO LATERAL --- */}
          <div className="lg:col-span-1 lg:pl-6 xl:pl-12">
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
