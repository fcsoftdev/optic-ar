import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Modos de tema disponibles. */
export type Theme = "light" | "dark" | "auto";

interface ThemeStore {
  theme: Theme;
  /** Cambia el tema activo y lo persiste en localStorage. */
  setTheme: (t: Theme) => void;
}

/**
 * Store global de tema con persistencia en localStorage.
 *
 * - "light"  → fuerza tema claro independientemente del SO.
 * - "dark"   → fuerza tema oscuro independientemente del SO.
 * - "auto"   → sigue la preferencia del sistema operativo (prefers-color-scheme).
 */
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "auto",
      setTheme: (theme) => set({ theme }),
    }),
    { name: "opticar-theme" },
  ),
);
