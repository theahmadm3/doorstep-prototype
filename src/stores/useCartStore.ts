
import create from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MenuItem, Order, OrderItem, OrderStatus, OptionChoice } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface CartState {
  orders: Order[];
  addOrUpdateItem: (item: MenuItem, quantity: number, selectedOptions: OptionChoice[]) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  increaseOrderItemQuantity: (orderId: string, cartItemId: string) => void;
  decreaseOrderItemQuantity: (orderId: string, cartItemId: string) => void;
  removeOrderItem: (orderId: string, cartItemId: string) => void;
  removeUnsubmittedOrder: (orderId: string) => void;
  clearUserOrders: () => void;
}

const calculateGrandTotal = (items: OrderItem[]) => {
  return items.reduce((acc, item) => acc + item.totalPrice, 0);
};

const areOptionsSetsEqual = (optionsA: OptionChoice[], optionsB: OptionChoice[]) => {
    if (optionsA.length !== optionsB.length) return false;
    const aIds = optionsA.map(o => o.id).sort();
    const bIds = optionsB.map(o => o.id).sort();
    return aIds.every((id, index) => id === bIds[index]);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      orders: [],

      addOrUpdateItem: (menuItem: MenuItem, quantity: number, selectedOptions: OptionChoice[]) => {
        const { orders } = get();
        
        const optionsPrice = selectedOptions.reduce((acc, opt) => acc + parseFloat(opt.price_adjustment), 0);
        const singleItemPrice = parseFloat(menuItem.price) + optionsPrice;
        const totalItemPrice = singleItemPrice * quantity;

        // Check for an existing unsubmitted order for this restaurant
        const existingOrder = orders.find(o => o.restaurantId === menuItem.restaurant && o.status === 'unsubmitted');
        
        if (existingOrder) {
          // Find an item in the cart with the same base menuItem and the exact same set of options
          const existingCartItem = existingOrder.items.find(
            item => item.menuItem.id === menuItem.id && areOptionsSetsEqual(item.options, selectedOptions)
          );

          let newItems: OrderItem[];

          if (existingCartItem) {
            // If found, just update its quantity
            newItems = existingOrder.items.map(item =>
              item.cartItemId === existingCartItem.cartItemId
                ? { ...item, quantity: item.quantity + quantity, totalPrice: singleItemPrice * (item.quantity + quantity) }
                : item
            );
          } else {
            // If not found, add a new OrderItem to the existing order
            const newCartItem: OrderItem = {
              cartItemId: uuidv4(),
              menuItem: menuItem,
              quantity: quantity,
              options: selectedOptions,
              totalPrice: totalItemPrice,
            };
            newItems = [...existingOrder.items, newCartItem];
          }
          
          const updatedOrder: Order = { ...existingOrder, items: newItems, total: calculateGrandTotal(newItems) };
          set({ orders: orders.map(o => o.id === updatedOrder.id ? updatedOrder : o) });
          return updatedOrder;

        } else {
          // No unsubmitted order for this restaurant exists. Create a new one.
          // Clear any other unsubmitted orders from other restaurants.
          const otherPlacedOrders = orders.filter(o => o.status !== 'unsubmitted');
          
          const newCartItem: OrderItem = {
            cartItemId: uuidv4(),
            menuItem: menuItem,
            quantity: quantity,
            options: selectedOptions,
            totalPrice: totalItemPrice,
          };

          const newOrder: Order = {
            id: uuidv4(),
            restaurantId: menuItem.restaurant,
            items: [newCartItem],
            status: 'unsubmitted',
            total: totalItemPrice,
          };
          set({ orders: [...otherPlacedOrders, newOrder] });
          return newOrder;
        }
      },

      updateOrderStatus: (orderId, status) => {
        set(state => ({
          orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
        }));
      },

      increaseOrderItemQuantity: (orderId, cartItemId) => {
        set(state => ({
          orders: state.orders.map(order => {
            if (order.id === orderId) {
              const newItems = order.items.map(item => {
                if (item.cartItemId === cartItemId) {
                  const newQuantity = item.quantity + 1;
                  const singleItemPrice = item.totalPrice / item.quantity;
                  return { ...item, quantity: newQuantity, totalPrice: singleItemPrice * newQuantity };
                }
                return item;
              });
              return { ...order, items: newItems, total: calculateGrandTotal(newItems) };
            }
            return order;
          })
        }));
      },

      decreaseOrderItemQuantity: (orderId, cartItemId) => {
        set(state => {
          let orderToUpdate = state.orders.find(order => order.id === orderId);
          if (!orderToUpdate) return state;

          const itemToUpdate = orderToUpdate.items.find(item => item.cartItemId === cartItemId);
          if (!itemToUpdate) return state;
          
          let newItems: OrderItem[];

          if (itemToUpdate.quantity <= 1) {
            // Remove the item if quantity is 1 or less
            newItems = orderToUpdate.items.filter(item => item.cartItemId !== cartItemId);
          } else {
            // Otherwise, just decrement
            newItems = orderToUpdate.items.map(item => {
                if (item.cartItemId === cartItemId) {
                  const newQuantity = item.quantity - 1;
                  const singleItemPrice = item.totalPrice / item.quantity;
                  return { ...item, quantity: newQuantity, totalPrice: singleItemPrice * newQuantity };
                }
                return item;
              });
          }

          if (newItems.length === 0) {
            // If no items left in the order, remove the entire order
            return { orders: state.orders.filter(order => order.id !== orderId) };
          }
          
          return {
            orders: state.orders.map(order =>
              order.id === orderId
                ? { ...order, items: newItems, total: calculateGrandTotal(newItems) }
                : order
            )
          };
        });
      },
      
      removeOrderItem: (orderId, cartItemId) => {
        set(state => {
           const orderToUpdate = state.orders.find(order => order.id === orderId);
           if (!orderToUpdate) return state;

           const newItems = orderToUpdate.items.filter(item => item.cartItemId !== cartItemId);
           
           if (newItems.length === 0) {
               // Remove order if no items left
               return { orders: state.orders.filter(order => order.id !== orderId) };
           }

           return {
               orders: state.orders.map(order =>
                    order.id === orderId
                        ? { ...order, items: newItems, total: calculateGrandTotal(newItems) }
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
