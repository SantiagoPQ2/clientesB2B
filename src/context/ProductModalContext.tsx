// src/context/ProductModalContext.tsx
import { createContext, useContext, useState } from "react";

const ProductModalContext = createContext(null);

export const ProductModalProvider = ({ children }) => {
  const [categoriaObjetivo, setCategoriaObjetivo] = useState(null);
  const [productoObjetivo, setProductoObjetivo] = useState(null);

  // Función para abrir producto desde el buscador
  const openProductFromSearch = (producto) => {
    setCategoriaObjetivo(producto.categoria);
    setProductoObjetivo(producto);
  };

  // Función para limpiar valores al finalizar
  const clearTargets = () => {
    setCategoriaObjetivo(null);
    setProductoObjetivo(null);
  };

  return (
    <ProductModalContext.Provider value={{
      categoriaObjetivo,
      productoObjetivo,
      openProductFromSearch,
      clearTargets,
    }}>
      {children}
    </ProductModalContext.Provider>
  );
};

export const useProductModal = () => useContext(ProductModalContext);
