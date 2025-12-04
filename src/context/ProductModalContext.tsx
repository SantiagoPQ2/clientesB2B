import { createContext, useContext, useState } from "react";

const ProductModalContext = createContext<any>(null);

export const ProductModalProvider = ({ children }) => {
  const [producto, setProducto] = useState(null);

  const openProductModal = (prod) => setProducto(prod);
  const closeProductModal = () => setProducto(null);

  return (
    <ProductModalContext.Provider value={{ producto, openProductModal, closeProductModal }}>
      {children}
    </ProductModalContext.Provider>
  );
};

export const useProductModal = () => useContext(ProductModalContext);
