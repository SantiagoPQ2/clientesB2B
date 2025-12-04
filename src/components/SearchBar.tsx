import React, { useState, useEffect } from "react";
import { supabase } from "../config/supabase";
import { useNavigate } from "react-router-dom";
import { useProductModal } from "../context/ProductModalContext";
import { Search } from "lucide-react";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState([]);
  const [productos, setProductos] = useState([]);

  const navigate = useNavigate();
  const { openProductFromSearch } = useProductModal();

  // Cargar productos
  useEffect(() => {
    supabase.from("z_productos").select("*").then(({ data }) => {
      setProductos(data || []);
    });
  }, []);

  // Filtrar
  useEffect(() => {
    if (!query.trim()) return setResultados([]);

    const q = query.toLowerCase();

    const rutas = [
      { icon: "🛒", nombre: "Carrito", ruta: "/b2b/carrito" },
      { icon: "📦", nombre: "Pedidos", ruta: "/b2b/pedidos" },
      { icon: "📙", nombre: "Catálogo", ruta: "/b2b/catalogo" }
    ].filter(i => i.nombre.toLowerCase().includes(q));

    const prods = productos.filter(p => {
      const n = p.nombre?.toLowerCase() || "";
      const a = p.articulo?.toLowerCase() || "";
      const c = p.categoria?.toLowerCase() || "";
      return n.includes(q) || a.includes(q) || c.includes(q);
    });

    setResultados([...rutas, ...prods]);
  }, [query, productos]);

  const seleccionar = (item) => {
    setQuery("");
    setResultados([]);

    if (item.ruta) return navigate(item.ruta);

    openProductFromSearch(item);
    navigate("/b2b/catalogo");
  };

  return (
    <div className="relative w-full">
      {/* INPUT DE BUSQUEDA FIJO */}
      <div className="flex items-center bg-white border rounded-full px-3 py-2 shadow-sm">
        <Search size={18} className="text-gray-500" />
        <input
          type="text"
          placeholder="¿Qué querés comprar hoy?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full ml-2 outline-none text-sm"
        />
      </div>

      {/* RESULTADOS */}
      {query.length > 0 && (
        <div className="absolute bg-white w-full mt-2 rounded-lg shadow-xl border max-h-80 overflow-y-auto z-50">
          {resultados.map((item, i) => (
            <div
              key={i}
              onClick={() => seleccionar(item)}
              className="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer"
            >
              {item.ruta ? (
                <span className="text-xl">{item.icon}</span>
              ) : (
                <img src={item.imagen_url} className="w-10 h-10 object-contain rounded" />
              )}

              <div>
                <p className="text-sm font-medium">{item.nombre}</p>
                {"categoria" in item && (
                  <p className="text-xs text-gray-500">{item.categoria}</p>
                )}
              </div>
            </div>
          ))}

          {query.length > 0 && resultados.length === 0 && (
            <p className="text-sm p-3 text-gray-500">No se encontraron resultados</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
