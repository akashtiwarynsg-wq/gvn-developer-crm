import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useThemeStore = create(
  persist(
    (set, get) => ({
      dark: false,
      sidebarOpen: true,
      toggle: () => {
        const next = !get().dark
        document.documentElement.classList.toggle('dark', next)
        set({ dark: next })
      },
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      init: () => {
        const { dark } = get()
        document.documentElement.classList.toggle('dark', dark)
      },
    }),
    { name: 'gvn-theme' }
  )
)

export default useThemeStore
