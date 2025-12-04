import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";

interface Producto {
  id: string;
  nombre: string | null;
  categoria: string | null;
  articulo: string | null;
  imagen_url?: string;
}

const SearchBar = ({ onProductSelect }) => {
  const [open, setOpen] = useState(false);        // mostrar/ocultar barra
  const [query, setQuery] = useState("");         // texto
  const [resultados, setResultados] = useState<any[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  // ============================
  // Cerrar al hacer click afuera
  // ============================
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      setOpen(false);
      setQuery("");
      setResultados([]);
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, []);

  // ============================
  // Cargar productos
  // ============================
  useEffect(() => {
    supabase.from("z_productos").select("*").then(({ data }) => {
      setProductos(data || []);
    });
  }, []);

  // ============================
  // Filtrar
  // ============================
  useEffect(() => {
    if (!query.trim()) return setResultados([]);

    const q = query.toLowerCase();

    const rutas = [
      { icon: "🛒", nombre: "Carrito", ruta: "/b2b/carrito" },
      { icon: "📦", nombre: "Pedidos", ruta: "/b2b/pedidos" },
      { icon: "📙", nombre: "Catálogo", ruta: "/b2b/catalogo" }
    ].filter((r) => r.nombre.toLowerCase().includes(q));

    const prods = productos.filter((p) => {
      const n = p.nombre?.toLowerCase() || "";
      const a = p.articulo?.toLowerCase() || "";
      const c = p.categoria?.toLowerCase() || "";

      return n.includes(q) || a.includes(q) || c.includes(q);
    });

    setResultados([...rutas, ...prods]);
  }, [query, productos]);

  // ============================
  // Selección
  // ============================
  const seleccionar = (item: any) => {
    setQuery("");
    setResultados([]);
    setOpen(false);

    if (item.ruta) return navigate(item.ruta);
    onProductSelect(item);
  };

  return (
    <div className="relative" ref={ref}>
      {/* ICONO DE LUPA */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-gray-100 transition"
      >
        <Search size={20} className="text-gray-700" />
      </button>

      {/* INPUT DESPLEGABLE */}
      {open && (
        <div className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border p-3 w-72 z-50 animate-fadeIn">
          <input
            type="text"
            placeholder="Buscar..."
            autoFocus
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-red-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {/* RESULTADOS */}
          {resultados.length > 0 && (
            <div className="mt-2 max-h-80 overflow-auto divide-y">
              {resultados.map((item, i) => (
                <div
                  key={i}
                  onClick={() => seleccionar(item)}
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 cursor-pointer"
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
                    <p className="font-medium text-sm">{item.nombre}</p>
                    {item.categoria && (
                      <p className="text-xs text-gray-500">{item.categoria}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SIN RESULTADOS */}
          {query.length > 0 && resultados.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">No se encontraron resultados</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
