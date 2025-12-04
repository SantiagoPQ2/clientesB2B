import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";
import { useProductModal } from "../context/ProductModalContext";

const SearchBar = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState([]);
  const [productos, setProductos] = useState([]);

  const navigate = useNavigate();
  const ref = useRef(null);

  const { openProductFromSearch } = useProductModal();

  // ============================
  // Cargar productos
  // ============================
  useEffect(() => {
    supabase.from("z_productos").select("*").then(({ data }) => {
      setProductos(data || []);
    });
  }, []);

  // ============================
  // Cerrar si clickeo afuera
  // ============================
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      setOpen(false);
      setQuery("");
      setResultados([]);
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, []);

  // ============================
  // Filtrar resultados
  // ============================
  useEffect(() => {
    if (!query.trim()) return setResultados([]);

    const q = query.toLowerCase();

    const rutas = [
      { icon: "🛒", nombre: "Carrito", ruta: "/b2b/carrito" },
      { icon: "📦", nombre: "Pedidos", ruta: "/b2b/pedidos" },
      { icon: "📙", nombre: "Catálogo", ruta: "/b2b/catalogo" }
    ].filter((i) => i.nombre.toLowerCase().includes(q));

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
  const seleccionar = (item) => {
    setOpen(false);
    setQuery("");
    setResultados([]);

    // Si es ruta → ir directo
    if (item.ruta) return navigate(item.ruta);

    // Si es producto:
    // 1️⃣ Guardamos qué categoría abrir
    // 2️⃣ Guardamos qué producto mostrar
    // 3️⃣ Vamos al catálogo
    openProductFromSearch(item);
    navigate("/b2b/catalogo");
  };

  return (
    <div className="relative" ref={ref}>
      {/* ICONO */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-gray-100"
      >
        <Search size={20} className="text-gray-700" />
      </button>

      {/* SEARCH PANEL */}
      {open && (
        <div className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border p-3 w-72 z-50">
          <input
            type="text"
            placeholder="Buscar..."
            autoFocus
            className="w-full px-3 py-2 border rounded-lg text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="mt-2 max-h-80 overflow-auto divide-y">
            {resultados.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => seleccionar(item)}
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
                  {"categoria" in item && (
                    <p className="text-xs text-gray-500">{item.categoria}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {query.length > 0 && resultados.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              No se encontraron resultados
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
