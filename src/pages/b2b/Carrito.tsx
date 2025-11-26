import React from "react";
import { useCart } from "../../context/CartContext";

const CarritoB2B: React.FC = () => {
  const { cart, increase, decrease, removeItem, getTotal } = useCart();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Tu Carrito</h2>

      {cart.length === 0 && <p>No hay productos agregados.</p>}

      {cart.map((item) => (
        <div
          key={item.id}
          className="flex justify-between items-center border-b py-3"
        >
          <div>
            <h4 className="font-semibold">{item.nombre}</h4>
            <p>${item.precio}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => decrease(item.id)}
              className="px-2 bg-gray-300 rounded"
            >
              -
            </button>

            <span>{item.cantidad}</span>

            <button
              onClick={() => increase(item.id)}
              className="px-2 bg-green-600 text-white rounded"
            >
              +
            </button>

            <button
              onClick={() => removeItem(item.id)}
              className="ml-4 px-3 py-1 bg-red-600 text-white rounded"
            >
              X
            </button>
          </div>
        </div>
      ))}

      {cart.length > 0 && (
        <div className="mt-6 text-right text-xl font-semibold">
          Total: ${getTotal()}
        </div>
      )}
    </div>
  );
};

export default CarritoB2B;

