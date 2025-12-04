import React, { useState, useEffect } from "react";

interface Producto {
  id: string;
  articulo: string;
  nombre: string;
  marca?: string;
  categoria?: string;
  precio: number;
  imagen_url?: string;
}

interface Props {
  producto: Producto;
  cantidadInicial?: number;
  onClose: () => void;
  onConfirm: (cantidad: number) => void;
}

const ProductoModal: React.FC<Props> = ({
  producto,
  cantidadInicial = 0,
  onClose,
  onConfirm,
}) => {
  const [cantidad, setCantidad] = useState<number>(cantidadInicial || 0);

  // Si cambia el producto o la cantidad inicial desde afuera
  useEffect(() => {
    setCantidad(cantidadInicial || 0);
  }, [cantidadInicial, producto?.id]);

  const cambiarCantidad = (nueva: number) => {
    if (nueva < 0) nueva = 0;
    setCantidad(nueva);
  };

  const handleConfirm = () => {
    // 🔒 Seguridad extra: evitar el "c is not a function"
    if (typeof onConfirm === "function") {
      onConfirm(cantidad);
    } else {
      console.error("ProductoModal: onConfirm no es una función", onConfirm);
    }
    onClose();
  };

  if (!producto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-[90%] overflow-hidden">
        {/* HEADER */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {producto.categoria || "Producto"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="px-5 py-4 flex flex-col items-center gap-4">
          {/* Imagen */}
          <div className="w-40 h-40 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
            {producto.imagen_url ? (
              <img
                src={producto.imagen_url}
                alt={producto.nombre}
                className="max-h-full object-contain"
              />
            ) : (
              <span className="text-[11px] text-gray-400 text-center px-2">
                Sin imagen
                <br />
                Código: {producto.articulo}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="w-full text-center">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              {producto.marca}
            </p>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {producto.nombre}
            </h3>

            <p className="text-[11px] text-gray-500 mb-1 uppercase">Precio</p>
            <p className="text-2xl font-extrabold text-red-600">
              $
              {producto.precio.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* Cantidad */}
          <div className="w-full mt-2">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Cantidad
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-lg hover:bg-gray-100"
                onClick={() => cambiarCantidad(cantidad - 1)}
              >
                −
              </button>

              <input
                type="number"
                className="w-16 text-center border border-gray-300 rounded-lg py-1 text-sm"
                value={cantidad}
                onChange={(e) =>
                  cambiarCantidad(Number(e.target.value) || 0)
                }
              />

              <button
                className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-lg hover:bg-gray-100"
                onClick={() => cambiarCantidad(cantidad + 1)}
              >
                +
              </button>
            </div>

            <p className="text-[11px] text-gray-400 mt-1 text-center">
              Podés escribir directamente la cantidad que quieras.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-5 pb-4 pt-2 flex flex-col gap-2">
          <button
            onClick={handleConfirm}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-semibold"
          >
            Confirmar cantidad y volver
          </button>

          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-semibold"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductoModal;
