import { createContext, useContext, useState, ReactNode } from "react";

export interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface CartContextType {
  cart: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  increase: (id: string) => void;
  decrease: (id: string) => void;
  getTotal: () => number;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addItem = (item: CartItem) => {
    setCart((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, cantidad: p.cantidad + 1 } : p
        );
      }
      return [...prev, { ...item, cantidad: 1 }];
    });
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  };

  const increase = (id: string) => {
    setCart((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, cantidad: p.cantidad + 1 } : p
      )
    );
  };

  const decrease = (id: string) => {
    setCart((prev) =>
      prev
        .map((p) =>
          p.id === id && p.cantidad > 1
            ? { ...p, cantidad: p.cantidad - 1 }
            : p
        )
        .filter((p) => p.cantidad > 0)
    );
  };

  const getTotal = () =>
    cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  return (
    <CartContext.Provider
      value={{ cart, addItem, removeItem, increase, decrease, getTotal }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
