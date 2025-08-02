
"use client";

import React, { createContext, useState, useEffect } from 'react';
import type { MenuItem } from '@/lib/types';

export interface CartItem extends MenuItem {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: MenuItem) => boolean;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  increaseQuantity: (itemId: string) => void;
  decreaseQuantity: (itemId: string) => void;
  clearCart: () => void;
  cartRestaurantId: string | null;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartRestaurantId, setCartRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('doorstepCart');
      const storedRestaurantId = localStorage.getItem('doorstepCartRestaurantId');
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
      if (storedRestaurantId) {
        setCartRestaurantId(JSON.parse(storedRestaurantId));
      }
    } catch (error) {
      console.error("Failed to parse cart from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('doorstepCart', JSON.stringify(cart));
      localStorage.setItem('doorstepCartRestaurantId', JSON.stringify(cartRestaurantId));
       if (cart.length === 0) {
        setCartRestaurantId(null);
        localStorage.removeItem('doorstepCartRestaurantId');
      }
    } catch (error) {
      console.error("Failed to save cart to localStorage", error);
    }
  }, [cart, cartRestaurantId]);

  const addToCart = (item: MenuItem): boolean => {
    if (cartRestaurantId && cartRestaurantId !== item.restaurant) {
      return false; // Indicate that a confirmation is needed
    }

    setCart(prevCart => {
      if (prevCart.length === 0) {
        setCartRestaurantId(item.restaurant);
      }
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
    return true;
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => {
      const newCart = prevCart.filter(item => item.id !== itemId);
      if (newCart.length === 0) {
        setCartRestaurantId(null);
      }
      return newCart;
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(prevCart =>
        prevCart.map(item => (item.id === itemId ? { ...item, quantity } : item))
      );
    }
  };

  const increaseQuantity = (itemId: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (itemId: string) => {
    setCart(prevCart => {
      const newCart = prevCart.map(item =>
        item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item
      ).filter(item => item.quantity > 0);
      
      if (newCart.length === 0) {
        setCartRestaurantId(null);
      }
      return newCart;
    });
  };
  
  const clearCart = () => {
    setCart([]);
    setCartRestaurantId(null);
  }

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, increaseQuantity, decreaseQuantity, clearCart, cartRestaurantId }}>
      {children}
    </CartContext.Provider>
  );
};
