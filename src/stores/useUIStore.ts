
import create from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Address } from '@/lib/types';

interface UIState {
  selectedAddress: Address | null;
  setSelectedAddress: (address: Address | null) => void;
  clearUIState: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      selectedAddress: null,
      setSelectedAddress: (address) => set({ selectedAddress: address }),
      clearUIState: () => set({ selectedAddress: null }),
    }),
    {
      name: 'doorstep-ui-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
