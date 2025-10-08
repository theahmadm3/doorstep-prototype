
"use client";

import { useOrder as useOrderQuery } from "@/hooks/queries/use-orders";
import { useCartStore } from "@/stores/useCartStore";
import { useUIStore } from "@/stores/useUIStore";

export const useOrder = () => {
    // Zustand store for client-side cart state
    const { 
        orders, 
        guestCart,
        addOrUpdateOrder,
        updateOrderStatus,
        increaseOrderItemQuantity,
        decreaseOrderItemQuantity,
        removeUnsubmittedOrder,
        addToGuestCart,
        clearGuestCart,
        increaseGuestItemQuantity,
        decreaseGuestItemQuantity,
        removeGuestItem,
        clearUserOrders 
    } = useCartStore();
    
    // Zustand store for general UI state
    const { 
        viewedRestaurant, 
        setViewedRestaurant,
        selectedAddress,
        setSelectedAddress
    } = useUIStore();

    // Custom hook wrapping TanStack Query for server-side order data
    // This is just an example of how you might use it.
    // The actual useQuery calls are now in the components themselves or in dedicated query hooks.
    // For this refactoring, we will use the Zustand stores primarily.
    
    return {
        // From useCartStore
        orders,
        guestCart,
        addOrUpdateOrder,
        updateOrderStatus,
        increaseOrderItemQuantity,
        decreaseOrderItemQuantity,
        removeUnsubmittedOrder,
        addToGuestCart,
        clearGuestCart,
        increaseGuestItemQuantity,
        decreaseGuestItemQuantity,
        removeGuestItem,
        clearUserOrders,

        // From useUIStore
        viewedRestaurant,
        setViewedRestaurant,
        selectedAddress,
        setSelectedAddress,
    };
};
