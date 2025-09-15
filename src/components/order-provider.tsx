
"use client";

import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { MenuItem, Order, OrderStatus, OrderItem } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// New interface for the Guest Cart
interface GuestCart {
  restaurantId: string | null;
  items: OrderItem[];
}

interface StoredOrders {
  timestamp: number;
  orders: Order[];
}

interface OrderContextType {
  orders: Order[];
  addOrUpdateOrder: (item: MenuItem) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  increaseOrderItemQuantity: (orderId: string, itemId: string) => void;
  decreaseOrderItemQuantity: (orderId: string, itemId: string) => void;
  
  guestCart: GuestCart;
  addToGuestCart: (item: MenuItem) => boolean;
  clearGuestCart: () => void;
  increaseGuestItemQuantity: (itemId: string) => void;
  decreaseGuestItemQuantity: (itemId: string) => void;
  removeGuestItem: (itemId: string) => void;
}

export const OrderContext = createContext<OrderContextType | undefined>(undefined);

const GUEST_CART_STORAGE_KEY = 'doorstepGuestCart';
const USER_ORDERS_STORAGE_KEY = 'doorstepOrders';
const EXPIRY_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const OrderProvider = ({ children }: { children: React.ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [guestCart, setGuestCart] = useState<GuestCart>({ restaurantId: null, items: [] });
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      // Load guest cart
      const storedGuestCart = localStorage.getItem(GUEST_CART_STORAGE_KEY);
      if (storedGuestCart) {
        setGuestCart(JSON.parse(storedGuestCart));
      }

      // Load user orders
      const storedUserOrders = localStorage.getItem(USER_ORDERS_STORAGE_KEY);
      if (storedUserOrders) {
          const { timestamp, orders: savedOrders } = JSON.parse(storedUserOrders) as StoredOrders;
          if (Date.now() - timestamp > EXPIRY_DURATION) {
              // Orders have expired, clear them
              localStorage.removeItem(USER_ORDERS_STORAGE_KEY);
          } else {
              setOrders(savedOrders.filter(o => o.status === 'unsubmitted'));
          }
      }

    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
    }
    setIsInitialLoad(false);
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    if (isInitialLoad) return;
    try {
      // Save guest cart
      localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(guestCart));

      // Save user orders
      const unsubmittedOrders = orders.filter(o => o.status === 'unsubmitted');
      if (unsubmittedOrders.length > 0) {
        const dataToStore: StoredOrders = {
            timestamp: Date.now(),
            orders: unsubmittedOrders
        };
        localStorage.setItem(USER_ORDERS_STORAGE_KEY, JSON.stringify(dataToStore));
      } else {
        localStorage.removeItem(USER_ORDERS_STORAGE_KEY);
      }

    } catch (error) {
      console.error("Failed to save data to localStorage", error);
    }
  }, [guestCart, orders, isInitialLoad]);
  

  // --- Logged-in User Order Management ---
  const addOrUpdateOrder = useCallback((item: MenuItem): Order => {
    let updatedOrder: Order | undefined;
    setOrders(prevOrders => {
      const existingUnsubmittedOrder = prevOrders.find(o => o.restaurantId === item.restaurant && o.status === 'unsubmitted');
      
      if (existingUnsubmittedOrder) {
        const existingItem = existingUnsubmittedOrder.items.find(i => i.id === item.id);
        let newItems: OrderItem[];
        if (existingItem) {
          newItems = existingUnsubmittedOrder.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
        } else {
          newItems = [...existingUnsubmittedOrder.items, { ...item, quantity: 1 }];
        }
        updatedOrder = { ...existingUnsubmittedOrder, items: newItems, total: newItems.reduce((acc, i) => acc + parseFloat(i.price) * i.quantity, 0) };
        return prevOrders.map(o => o.id === updatedOrder!.id ? updatedOrder : o);
      } else {
        updatedOrder = {
          id: uuidv4(),
          restaurantId: item.restaurant,
          items: [{ ...item, quantity: 1 }],
          status: 'unsubmitted',
          total: parseFloat(item.price)
        };
        return [...prevOrders, updatedOrder];
      }
    });
    return updatedOrder!;
  }, []);


  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prevOrders =>
      prevOrders.map(o => o.id === orderId ? { ...o, status } : o)
    );
  };
  
  const calculateOrderTotal = (items: OrderItem[]) => {
    return items.reduce((acc, i) => acc + parseFloat(i.price) * i.quantity, 0);
  };

  const increaseOrderItemQuantity = (orderId: string, itemId: string) => {
    setOrders(prevOrders => prevOrders.map(order => {
        if (order.id === orderId) {
            const newItems = order.items.map(item =>
                item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
            );
            return { ...order, items: newItems, total: calculateOrderTotal(newItems) };
        }
        return order;
    }));
  };

  const decreaseOrderItemQuantity = (orderId: string, itemId: string) => {
    setOrders(prevOrders => prevOrders.map(order => {
        if (order.id === orderId) {
            const newItems = order.items.map(item =>
                item.id === itemId ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
            );
            return { ...order, items: newItems, total: calculateOrderTotal(newItems) };
        }
        return order;
    }));
  };


  // --- Guest User Cart Management ---

  const addToGuestCart = (item: MenuItem): boolean => {
     if (guestCart.restaurantId && guestCart.restaurantId !== item.restaurant) {
      return false; // Indicate that a confirmation is needed
    }

    setGuestCart(prevCart => {
      const newRestaurantId = prevCart.restaurantId || item.restaurant;
      const existingItem = prevCart.items.find(cartItem => cartItem.id === item.id);
      let newItems;
      if (existingItem) {
        newItems = prevCart.items.map(cartItem =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      } else {
        newItems = [...prevCart.items, { ...item, quantity: 1 }];
      }
      return { restaurantId: newRestaurantId, items: newItems };
    });
    return true;
  };

  const increaseGuestItemQuantity = (itemId: string) => {
    setGuestCart(prevCart => ({
      ...prevCart,
      items: prevCart.items.map(item =>
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    }));
  };
  
  const decreaseGuestItemQuantity = (itemId: string) => {
    setGuestCart(prevCart => {
        const newItems = prevCart.items.map(item =>
            item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item
        ).filter(item => item.quantity > 0);

        return {
            ...prevCart,
            items: newItems,
            restaurantId: newItems.length === 0 ? null : prevCart.restaurantId,
        };
    });
  };

  const removeGuestItem = (itemId: string) => {
    setGuestCart(prevCart => {
        const newItems = prevCart.items.filter(item => item.id !== itemId);
        return {
             ...prevCart,
            items: newItems,
            restaurantId: newItems.length === 0 ? null : prevCart.restaurantId,
        };
    });
  };
  
  const clearGuestCart = () => {
    setGuestCart({ restaurantId: null, items: [] });
  };


  return (
    <OrderContext.Provider value={{ orders, addOrUpdateOrder, updateOrderStatus, guestCart, addToGuestCart, clearGuestCart, increaseGuestItemQuantity, decreaseGuestItemQuantity, removeGuestItem, increaseOrderItemQuantity, decreaseOrderItemQuantity }}>
      {children}
    </OrderContext.Provider>
  );
};
