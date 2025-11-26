import React from "react";
import { useNavigate } from "react-router-dom";

export default function Promos() {
  const navigate = useNavigate();

  const promos = [
    { id: "promo1", nombre: "Promo 1", precio: 1999 },
    { id: "promo2", nombre: "Promo 2", precio: 2999 },
    { id: "promo3", nombre: "Promo 3", precio: 3499 },
    { id: "promo4", nombre: "Promo 4", precio: 3999 },
  ];

  const agregarCarrito = (item: any) => {
    const carritoActual = JSON.parse(localStorage.getItem("carrito") || "[]");

    carritoActual.push({
      id: item.id,
      nombre: item.nombre,
      precio: item.precio,
      cantidad: 1,
    });

    localStorage.setItem("carrito", JSON.stringify(carritoActual));
    alert(item.nombre + " agregado al carrito");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Promociones Especiales</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {promos.map((promo) => (
          <div
            key={promo.id}
            className="bg-white shadow rounded p-5 flex flex-col items-center text-center"
          >
            <div className="w-full h-32 bg-gray-200 rounded mb-3 flex items-center justify-center">
              <span className="text-gray-500">Imagen</span>
            </div>

            <h2 className="text-xl font-semibold">{promo.nombre}</h2>
            <p className="text-lg font-bold text-red-600">${promo.precio}</p>

            <button
              onClick={() => agregarCarrito(promo)}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Agregar al Carrito
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate("/catalogo")}
        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-lg"
      >
        Siguiente → Ver Catálogo
      </button>
    </div>
  );
}
