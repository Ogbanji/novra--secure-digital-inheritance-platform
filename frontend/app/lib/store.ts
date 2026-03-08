import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  userId: string;
  email: string;
  heirCount: number;
  vaultCount: number;
  storage_limit_gb: number;
  storage_used_mb: number;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token: string) => set({ token }),
      setUser: (user: User) => set({ user }),
      logout: () => set({ token: null, user: null })
    }),
    {
      name: 'auth-storage'
    }
  )
);

interface VaultItem {
  id: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  recipients: string[];
  tags: string[];
  created_at: string;
}

interface VaultState {
  items: VaultItem[];
  setItems: (items: VaultItem[]) => void;
  addItem: (item: VaultItem) => void;
  removeItem: (id: string) => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  items: [],
  setItems: (items: VaultItem[]) => set({ items }),
  addItem: (item: VaultItem) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id: string) => set((state) => ({ items: state.items.filter(item => item.id !== id) }))
}));

interface Heir {
  id: string;
  name: string;
  email: string;
  relationship: string;
  inheritance_share: number;
  permissions: string[];
  status: string;
}

interface HeirState {
  heirs: Heir[];
  setHeirs: (heirs: Heir[]) => void;
  addHeir: (heir: Heir) => void;
  removeHeir: (id: string) => void;
}

export const useHeirStore = create<HeirState>((set) => ({
  heirs: [],
  setHeirs: (heirs: Heir[]) => set({ heirs }),
  addHeir: (heir: Heir) => set((state) => ({ heirs: [...state.heirs, heir] })),
  removeHeir: (id: string) => set((state) => ({ heirs: state.heirs.filter(heir => heir.id !== id) }))
}));