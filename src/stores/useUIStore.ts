
import create from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Address, Restaurant } from '@/lib/types';

interface UIState {
  viewedRestaurant: Restaurant | null;
  setViewedRestaurant: (restaurant: Restaurant | null) => void;
  selectedAddress: Address | null;
  setSelectedAddress: (address: Address | null) => void;
  clearUIState: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      viewedRestaurant: null,
      selectedAddress: null,
      setViewedRestaurant: (restaurant) => set({ viewedRestaurant: restaurant }),
      setSelectedAddress: (address) => set({ selectedAddress: address }),
      clearUIState: () => set({ viewedRestaurant: null, selectedAddress: null }),
    }),
    {
      name: 'doorstep-ui-storage', 
      storage: createJSONStorage(() => localStorage),
    }
  )
);
