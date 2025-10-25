
import create from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  phoneNumber: string | null;
  setPhoneNumber: (phone: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      phoneNumber: null,
      setPhoneNumber: (phone) => set({ phoneNumber: phone }),
    }),
    {
      name: 'doorstep-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
