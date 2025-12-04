import React, { useState, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";

interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  articulo: string;
  imagen_url?: string;
}

interface Props {
  onProductSelect?: (producto: Producto) => void;
}

const SearchBar: React.FC<Props> = ({ onProductSelect }) => {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const navigate = useNavigate();

  /* ===============================
        Cargar todos los productos
  =============================== */
  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase.from("z_productos").select("*");
      setProductos(data || []);
    };
    cargar();
  }, []);

  /* ===============================
        Filtrar resultados
  =============================== */
  useEffect(() => {
    if (!query.trim()) {
      setResultados([]);
      return;
    }

    let q = query.toLowerCase();

    const rutas = [
      { icon: "🛒", nombre: "Carrito", ruta: "/b2b/carrito" },
      { icon: "📦", nombre: "Mis pedidos", ruta: "/b2b/pedidos" },
      { icon: "📙", nombre: "Catálogo", ruta: "/b2b/catalogo" },
    ].filter((r) => r.nombre.toLowerCase().includes(q));

    const prods = productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.articulo.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q)
    );

    setResultados([...rutas, ...prods]);
  }, [query, productos]);

  /* ===============================
        Manejar selección
  =============================== */
  const handleSelect = (item: any) => {
    setQuery("");
    setResultados([]);

    if (item.ruta) {
      navigate(item.ruta);
      return;
    }

    if (onProductSelect) {
      onProductSelect(item);
    }
  };

  return (
    <div className="relative">
      {/* INPUT */}
      <div className="flex items-center bg-white border border-gray-300 rounded-full px-3 py-1 shadow-sm">
        <FiSearch className="text-gray-600 mr-2" size={18} />
        <input
          type="text"
          placeholder="Buscar productos o secciones..."
          className="outline-none w-60 text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* RESULTADOS */}
      {resultados.length > 0 && (
        <div className="absolute top-12 left-0 w-80 bg-white shadow-xl rounded-lg border z-50 max-h-80 overflow-auto">
          {resultados.map((item, i) => (
            <div
              key={i}
              onClick={() => handleSelect(item)}
              className="p-3 flex items-center gap-3 hover:bg-gray-100 cursor-pointer"
            >
              {item.ruta ? (
                <span className="text-xl">{item.icon}</span>
              ) : (
                <img
                  src={item.imagen_url}
                  className="w-10 h-10 object-contain rounded"
                />
              )}

              <div>
                <p className="font-semibold text-sm">{item.nombre}</p>
                {item.categoria && (
                  <p className="text-xs text-gray-500">{item.categoria}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
