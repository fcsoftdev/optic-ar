import { create } from "zustand";

interface NavStore {
  /** ID de compra pendiente de abrir. null = sin navegación pendiente. */
  pendingCompraId: number | null;
  setPendingCompraId: (id: number) => void;
  clearPendingCompraId: () => void;
}

export const useNavStore = create<NavStore>((set) => ({
  pendingCompraId: null,
  setPendingCompraId: (id) => set({ pendingCompraId: id }),
  clearPendingCompraId: () => set({ pendingCompraId: null }),
}));
