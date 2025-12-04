import { createContext, useContext, useState } from "react";

const ProductModalContext = createContext<any>(null);

export const ProductModalProvider = ({ children }) => {
  const [producto, setProducto] = useState(null);
  const [categoriaObjetivo, setCategoriaObjetivo] = useState<string | null>(null);
  const [productoObjetivo, setProductoObjetivo] = useState<any>(null);

  const openProductModal = (prod) => setProducto(prod);
  const closeProductModal = () => setProducto(null);

  // Nueva función: abrir producto desde el buscador
  const openProductFromSearch = (prod) => {
    setCategoriaObjetivo(prod.categoria);
    setProductoObjetivo(prod);
  };

  return (
    <ProductModalContext.Provider
      value={{
        producto,
        openProductModal,
        closeProductModal,
        categoriaObjetivo,
        setCategoriaObjetivo,
        productoObjetivo,
        setProductoObjetivo
      }}
    >
      {children}
    </ProductModalContext.Provider>
  );
};

export const useProductModal = () => useContext(ProductModalContext);
