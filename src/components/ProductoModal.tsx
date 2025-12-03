import React, { useState } from "react";

interface ProductoModalProps {
  producto: any;
  cantidadInicial: number;
  onClose: () => void;
  onConfirm: (cantidad: number) => void;
}

export default function ProductoModal({
  producto,
  cantidadInicial,
  onClose,
  onConfirm,
}: ProductoModalProps) {
  const [cantidad, setCantidad] = useState(
    cantidadInicial > 0 ? String(cantidadInicial) : ""
  );

  const validarNumero = (v: string) => {
    // Solo números, sin ceros adelante
    if (/^\d*$/.test(v)) {
      // vacío permitido
      setCantidad(v);
    }
  };

  const confirmar = () => {
    const num = Number(cantidad || "1");
    onConfirm(num);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white p-6 rounded-xl shadow-xl w-[90%] max-w-md animate-fadeIn relative">

        {/* Cerrar */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        {/* Info */}
        <h2 className="text-lg font-bold text-gray-900">
          {producto.nombre}
        </h2>
        <p className="text-xs text-gray-500">{producto.marca} • {producto.categoria}</p>

        {/* Imagen */}
        <div className="flex justify-center my-4">
          {producto.imagen_url ? (
            <img
              src={producto.imagen_url}
              alt={producto.nombre}
              className="max-h-40 object-contain"
            />
          ) : (
            <div className="text-gray-400 text-xs">Sin imagen</div>
          )}
        </div>

        {/* Cantidad */}
        <label className="text-xs text-gray-600">Cantidad</label>
        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={() =>
              setCantidad((prev) =>
                String(Math.max(0, Number(prev || "0") - 1))
              )
            }
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
          >
            -
          </button>

          <input
            className="w-20 px-3 py-1 text-center border rounded"
            value={cantidad}
            onChange={(e) => validarNumero(e.target.value)}
            placeholder="0"
          />

          <button
            onClick={() =>
              setCantidad((prev) => String(Number(prev || "0") + 1))
            }
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
          >
            +
          </button>
        </div>

        <p className="text-[11px] text-gray-400 mt-1">
          Podés escribir directamente la cantidad que quieras.
        </p>

        {/* Confirmar */}
        <button
          onClick={confirmar}
          className="mt-4 w-full py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
        >
          Confirmar cantidad y volver
        </button>

        <button
          onClick={onClose}
          className="mt-2 w-full py-2 rounded-lg bg-gray-100 text-gray-600"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
