
import { create } from "zustand";

interface AuthState {
	accessToken: string | null;
	refreshToken: string | null;
	setTokens: (access: string | null, refresh: string | null) => void;
	clearTokens: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	accessToken: null,
	refreshToken: null,
	setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
	clearTokens: () => set({ accessToken: null, refreshToken: null }),
}));
