import React, { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import { useCart } from "../../context/CartContext";

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  marca: string;
  categoria: string;
}

const CatalogoB2B: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [marca, setMarca] = useState("Todas");
  const [categoria, setCategoria] = useState("Todas");

  const { cart, addItem, increase, decrease } = useCart();

  const cargarProductos = async () => {
    const { data } = await supabase.from("z_productos").select("*");
    setProductos(data || []);
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const filtrados = productos.filter((p) => {
    const matchBusqueda =
      busqueda === "" ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.id.includes(busqueda);

    const matchMarca = marca === "Todas" || p.marca === marca;
    const matchCategoria = categoria === "Todas" || p.categoria === categoria;

    return matchBusqueda && matchMarca && matchCategoria;
  });

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Catálogo B2B</h2>

      {/* FILTROS */}
      <div className="bg-white rounded shadow p-4 mb-6 w-72">
        <h4 className="font-semibold mb-2">Filtros</h4>

        <input
          className="border p-2 w-full rounded mb-3"
          placeholder="Nombre, código..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <select
          className="border p-2 w-full rounded mb-3"
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
        >
          <option>Todas</option>
          <option>Simplot</option>
          <option>Sadia</option>
        </select>

        <select
          className="border p-2 w-full rounded"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          <option>Todas</option>
          <option>Papas</option>
          <option>Rebozados</option>
        </select>
      </div>

      {/* PRODUCTOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filtrados.map((prod) => {
          const inCart = cart.find((x) => x.id === prod.id);

          return (
            <div
              key={prod.id}
              className="border rounded-lg p-5 shadow-sm bg-white"
            >
              <div className="w-full h-40 bg-gray-200 rounded mb-3 flex items-center justify-center">
                Sin imagen
              </div>

              <h3 className="font-semibold">{prod.nombre}</h3>
              <p className="text-red-600 font-semibold text-lg">
                ${prod.precio}
              </p>

              {!inCart && (
                <button
                  className="mt-3 bg-red-600 text-white px-4 py-2 rounded"
                  onClick={() =>
                    addItem({
                      id: prod.id,
                      nombre: prod.nombre,
                      precio: prod.precio,
                      cantidad: 1,
                    })
                  }
                >
                  Agregar
                </button>
              )}

              {inCart && (
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() => decrease(prod.id)}
                    className="px-3 py-1 bg-gray-300 rounded"
                  >
                    -
                  </button>

                  <span>{inCart.cantidad}</span>

                  <button
                    onClick={() => increase(prod.id)}
                    className="px-3 py-1 bg-green-600 text-white rounded"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CatalogoB2B;
