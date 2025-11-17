import create from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MenuItem, Order, OrderItem, OrderStatus } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface CartState {
  orders: Order[];
  addOrUpdateItem: (item: MenuItem, quantity: number) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  increaseOrderItemQuantity: (orderId: string, itemId: string) => void;
  decreaseOrderItemQuantity: (orderId: string, itemId: string) => void;
  removeOrderItem: (orderId: string, itemId: string) => void;
  removeUnsubmittedOrder: (orderId: string) => void;
  clearUserOrders: () => void;
}

const calculateOrderTotal = (items: OrderItem[]) => {
  return items.reduce((acc, i) => acc + parseFloat(i.price) * i.quantity, 0);
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      orders: [],

      addOrUpdateItem: (item: MenuItem, quantity: number) => {
        const { orders } = get();
        const existingUnsubmittedOrder = orders.find(o => o.restaurantId === item.restaurant && o.status === 'unsubmitted');
        let updatedOrder: Order;

        if (existingUnsubmittedOrder) {
          const existingItem = existingUnsubmittedOrder.items.find(i => i.id === item.id);
          let newItems: OrderItem[];
          if (existingItem) {
            // Item exists, update its quantity
            newItems = existingUnsubmittedOrder.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i);
          } else {
            // Item does not exist, add it
            newItems = [...existingUnsubmittedOrder.items, { ...item, quantity: quantity }];
          }
          updatedOrder = { ...existingUnsubmittedOrder, items: newItems, total: calculateOrderTotal(newItems) };
          set({ orders: orders.map(o => o.id === updatedOrder.id ? updatedOrder : o) });
        } else {
          // No unsubmitted order for this restaurant, create a new one
          // Also, clear any other unsubmitted orders from other restaurants
          const otherUnsubmittedOrders = orders.filter(o => o.status !== 'unsubmitted');
          updatedOrder = {
            id: uuidv4(),
            restaurantId: item.restaurant,
            items: [{ ...item, quantity: quantity }],
            status: 'unsubmitted',
            total: parseFloat(item.price) * quantity
          };
          set({ orders: [...otherUnsubmittedOrders, updatedOrder] });
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
          if (!itemToUpdate || itemToUpdate.quantity <= 1) {
              // If quantity is 1, remove the item instead of just decrementing
              const newItems = orderToUpdate.items.filter(item => item.id !== itemId);
              if (newItems.length === 0) {
                  // If no items left, remove the whole order
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
            // Decrement quantity if greater than 1
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
      
      removeOrderItem: (orderId: string, itemId: string) => {
        set(state => {
           const orderToUpdate = state.orders.find(order => order.id === orderId);
           if (!orderToUpdate) return state;

           const newItems = orderToUpdate.items.filter(item => item.id !== itemId);
           if (newItems.length === 0) {
               // Remove order if no items left
               return { orders: state.orders.filter(order => order.id !== orderId) };
           }
           // Update order with new items list
           return {
               orders: state.orders.map(order =>
                    order.id === orderId
                        ? { ...order, items: newItems, total: calculateOrderTotal(newItems) }
                        : order
                )
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
    }),
    {
      name: 'doorstep-cart-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist unsubmitted orders
      partialize: (state) => ({ orders: state.orders.filter(o => o.status === 'unsubmitted') }),
    }
  )
);
