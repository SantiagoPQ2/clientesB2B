import React, { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import { useNavigate } from "react-router-dom";
import CarritoSide from "../../components/CarritoSidePanel";

interface Producto {
  id: string;
  articulo: string;
  nombre: string;
  marca: string;
  categoria: string;
  precio: number;
  stock: number;
  imagen_url?: string;
}

const CatalogoB2B: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");
  const [carrito, setCarrito] = useState<Record<string, number>>({});
  const navigate = useNavigate();

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

    if (error) console.error(error);
    if (data) {
      setProductos(data);
      const cats = Array.from(new Set(data.map((p) => p.categoria).filter(Boolean)));
      setCategorias(cats);
    }
  };

  const agregarAlCarrito = (id: string) => {
    const nuevo = { ...carrito, [id]: (carrito[id] || 0) + 1 };
    guardarCarrito(nuevo);
  };

  const productosFiltrados = productos.filter((p) => {
    return (
      p.categoria === categoriaSeleccionada &&
      (busqueda ? p.nombre.toLowerCase().includes(busqueda.toLowerCase()) : true) &&
      (filtroMarca ? p.marca === filtroMarca : true)
    );
  });

  const marcasDisponibles = Array.from(
    new Set(
      productos
        .filter((p) => p.categoria === categoriaSeleccionada)
        .map((p) => p.marca)
        .filter(Boolean)
    )
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-6">

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">

        {/* ============================ */}
        {/*   PANTALLA DE CATEGORÍAS     */}
        {/* ============================ */}
        {!categoriaSeleccionada ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">

            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaSeleccionada(cat)}
                className="
                  w-full h-48 
                  bg-white rounded-2xl shadow-md 
                  flex items-center justify-center 
                  text-xl font-bold text-gray-800 
                  hover:shadow-xl hover:scale-[1.02]
                  transition-all
                "
              >
                {cat.toUpperCase()}
              </button>
            ))}

          </div>
        ) : (
          <>
            {/* ============================ */}
            {/*       FILTROS + LISTADO      */}
            {/* ============================ */}

            <div className="space-y-5">

              {/* BUSCADOR */}
              <input
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl"
              />

              {/* FILTRO MARCA */}
              <select
                value={filtroMarca}
                onChange={(e) => setFiltroMarca(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl"
              >
                <option value="">Todas las marcas</option>
                {marcasDisponibles.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              {/* LISTA DE PRODUCTOS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {productosFiltrados.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition"
                  >
                    <div className="h-48 bg-gray-50 flex items-center justify-center">
                      {p.imagen_url ? (
                        <img src={p.imagen_url} className="max-h-full object-contain" />
                      ) : (
                        <div className="text-gray-400 text-xs">{p.articulo}</div>
                      )}
                    </div>

                    <div className="p-4 flex flex-col h-44">
                      <h3 className="text-lg font-semibold">{p.nombre}</h3>

                      <div className="mt-auto flex justify-between items-center">
                        <p className="text-xl font-bold text-red-600">
                          $
                          {p.precio.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>

                        <button
                          onClick={() => agregarAlCarrito(p.id)}
                          className="px-4 py-2 bg-red-600 rounded-lg text-white font-semibold"
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              </div>

            </div>
          </>
        )}

        {/* ============================ */}
        {/*         CARRITO LATERAL      */}
        {/* ============================ */}
        <CarritoSide carrito={carrito} />

      </div>
    </div>
  );
};

export default CatalogoB2B;

