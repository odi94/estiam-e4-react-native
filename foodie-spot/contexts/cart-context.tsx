import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { Dish, CartItem } from '@/types';

interface CartContextType {
  items: CartItem[];
  addItem: (dish: Dish, quantity: number) => void;
  removeItem: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  deliveryFee: number;
  serviceFee: number;
  orderTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((dish: Dish, quantity: number) => {
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((item) => item.dish.id === dish.id);
      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      }
      return [...prevItems, { menuItemId: dish.id, dish, quantity }];
    });
  }, []);

  const removeItem = useCallback((dishId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.dish.id !== dishId));
  }, []);

  const updateQuantity = useCallback((dishId: string, quantity: number) => {
    setItems((prevItems) => {
      if (quantity <= 0) {
        return prevItems.filter((item) => item.dish.id !== dishId);
      }
      return prevItems.map((item) =>
        item.dish.id === dishId ? { ...item, quantity } : item
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((sum, item) => sum + item.dish.price * item.quantity, 0), [items]);
  
  const deliveryFee = totalPrice > 0 ? 2.5 : 0;
  const serviceFee = totalPrice > 0 ? 0.99 : 0;
  const orderTotal = totalPrice + deliveryFee + serviceFee;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        deliveryFee,
        serviceFee,
        orderTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
