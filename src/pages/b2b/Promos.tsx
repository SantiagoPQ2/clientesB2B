import React from "react";
import { useCart } from "../../context/CartContext";

const promos = [
  { id: "promo1", nombre: "Promo 1", precio: 1999 },
  { id: "promo2", nombre: "Promo 2", precio: 2999 },
  { id: "promo3", nombre: "Promo 3", precio: 3499 },
  { id: "promo4", nombre: "Promo 4", precio: 3999 },
];

const Promos: React.FC = () => {
  const { cart, addItem, increase, decrease } = useCart();

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6 text-center">Promociones</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {promos.map((promo) => {
          const inCart = cart.find((x) => x.id === promo.id);

          return (
            <div
              key={promo.id}
              className="border rounded-lg p-5 shadow-sm bg-white"
            >
              <div className="w-full h-40 bg-gray-200 rounded mb-3 flex items-center justify-center">
                Imagen
              </div>

              <h3 className="text-xl font-bold">{promo.nombre}</h3>
              <p className="text-red-600 text-lg font-semibold">
                ${promo.precio}
              </p>

              {!inCart && (
                <button
                  onClick={() =>
                    addItem({
                      id: promo.id,
                      nombre: promo.nombre,
                      precio: promo.precio,
                      cantidad: 1,
                    })
                  }
                  className="mt-3 bg-red-600 text-white px-4 py-2 rounded"
                >
                  Agregar
                </button>
              )}

              {inCart && (
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() => decrease(promo.id)}
                    className="px-3 py-1 bg-gray-300 rounded"
                  >
                    -
                  </button>

                  <span className="px-3">{inCart.cantidad}</span>

                  <button
                    onClick={() => increase(promo.id)}
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

      <div className="text-center mt-8">
        <a
          href="/b2b/catalogo"
          className="px-6 py-3 bg-blue-900 text-white rounded text-lg"
        >
          Siguiente → Ver Catálogo
        </a>
      </div>
    </div>
  );
};

export default Promos;
