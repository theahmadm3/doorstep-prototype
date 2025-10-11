
import create from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MenuItem, Order, OrderItem, OrderStatus } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface CartState {
  orders: Order[];
  guestCart: {
    restaurantId: string | null;
    items: OrderItem[];
  };
  addOrUpdateOrder: (item: MenuItem) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  increaseOrderItemQuantity: (orderId: string, itemId: string) => void;
  decreaseOrderItemQuantity: (orderId: string, itemId: string) => void;
  removeUnsubmittedOrder: (orderId: string) => void;
  addToGuestCart: (item: MenuItem) => boolean;
  clearGuestCart: () => void;
  increaseGuestItemQuantity: (itemId: string) => void;
  decreaseGuestItemQuantity: (itemId: string) => void;
  removeGuestItem: (itemId: string) => void;
  clearUserOrders: () => void;
}

const calculateOrderTotal = (items: OrderItem[]) => {
  return items.reduce((acc, i) => acc + parseFloat(i.price) * i.quantity, 0);
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      orders: [],
      guestCart: { restaurantId: null, items: [] },

      addOrUpdateOrder: (item: MenuItem) => {
        const { orders } = get();
        const existingUnsubmittedOrder = orders.find(o => o.restaurantId === item.restaurant && o.status === 'unsubmitted');
        let updatedOrder: Order;

        if (existingUnsubmittedOrder) {
          const existingItem = existingUnsubmittedOrder.items.find(i => i.id === item.id);
          let newItems: OrderItem[];
          if (existingItem) {
            newItems = existingUnsubmittedOrder.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
          } else {
            newItems = [...existingUnsubmittedOrder.items, { ...item, quantity: 1 }];
          }
          updatedOrder = { ...existingUnsubmittedOrder, items: newItems, total: calculateOrderTotal(newItems) };
          set({ orders: orders.map(o => o.id === updatedOrder.id ? updatedOrder : o) });
        } else {
          updatedOrder = {
            id: uuidv4(),
            restaurantId: item.restaurant,
            items: [{ ...item, quantity: 1 }],
            status: 'unsubmitted',
            total: parseFloat(item.price)
          };
          set({ orders: [...orders, updatedOrder] });
        }
        return updatedOrder;
      },

      updateOrderStatus: (orderId, status) => {
        set(state => ({
          orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
        }));
      },

      increaseOrderItemQuantity: (orderId, itemId) => {
        set(state => ({
          orders: state.orders.map(order => {
            if (order.id === orderId) {
              const newItems = order.items.map(item =>
                item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
              );
              return { ...order, items: newItems, total: calculateOrderTotal(newItems) };
            }
            return order;
          })
        }));
      },

      decreaseOrderItemQuantity: (orderId, itemId) => {
        set(state => {
          const orderToUpdate = state.orders.find(order => order.id === orderId);
          if (!orderToUpdate) return state;

          const itemToUpdate = orderToUpdate.items.find(item => item.id === itemId);
          if (!itemToUpdate) return state;

          if (itemToUpdate.quantity === 1) {
            const newItems = orderToUpdate.items.filter(item => item.id !== itemId);
            if (newItems.length === 0) {
              return { orders: state.orders.filter(order => order.id !== orderId) };
            }
            return {
              orders: state.orders.map(order =>
                order.id === orderId
                  ? { ...order, items: newItems, total: calculateOrderTotal(newItems) }
                  : order
              )
            };
          } else {
            const newItems = orderToUpdate.items.map(item =>
              item.id === itemId ? { ...item, quantity: item.quantity - 1 } : item
            );
            return {
              orders: state.orders.map(order =>
                order.id === orderId
                  ? { ...order, items: newItems, total: calculateOrderTotal(newItems) }
                  : order
              )
            };
          }
        });
      },

      removeUnsubmittedOrder: (orderId) => {
        set(state => ({
          orders: state.orders.filter(order => order.id !== orderId)
        }));
      },
      
      clearUserOrders: () => {
          set({ orders: [] });
      },

      // Guest Cart Logic
      addToGuestCart: (item) => {
        const { guestCart } = get();
        if (guestCart.restaurantId && guestCart.restaurantId !== item.restaurant) {
          return false; // Indicate confirmation needed
        }

        set(state => {
          const newRestaurantId = state.guestCart.restaurantId || item.restaurant;
          const existingItem = state.guestCart.items.find(cartItem => cartItem.id === item.id);
          let newItems;
          if (existingItem) {
            newItems = state.guestCart.items.map(cartItem =>
              cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
            );
          } else {
            newItems = [...state.guestCart.items, { ...item, quantity: 1 }];
          }
          return { guestCart: { restaurantId: newRestaurantId, items: newItems } };
        });
        return true;
      },

      clearGuestCart: () => {
        set({ guestCart: { restaurantId: null, items: [] } });
      },

      increaseGuestItemQuantity: (itemId) => {
        set(state => ({
          guestCart: {
            ...state.guestCart,
            items: state.guestCart.items.map(item =>
              item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
            )
          }
        }));
      },

      decreaseGuestItemQuantity: (itemId) => {
        set(state => {
          const newItems = state.guestCart.items.map(item =>
            item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item
          ).filter(item => item.quantity > 0);

          return {
            guestCart: {
              ...state.guestCart,
              items: newItems,
              restaurantId: newItems.length === 0 ? null : state.guestCart.restaurantId,
            }
          };
        });
      },

      removeGuestItem: (itemId) => {
        set(state => {
          const newItems = state.guestCart.items.filter(item => item.id !== itemId);
          return {
            guestCart: {
              ...state.guestCart,
              items: newItems,
              restaurantId: newItems.length === 0 ? null : state.guestCart.restaurantId,
            }
          };
        });
      }
    }),
    {
      name: 'doorstep-cart-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist the parts of the state we care about
      partialize: (state) => ({ guestCart: state.guestCart, orders: state.orders.filter(o => o.status === 'unsubmitted') }),
    }
  )
);
