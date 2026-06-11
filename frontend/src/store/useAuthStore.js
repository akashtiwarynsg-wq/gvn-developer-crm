import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/lib/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const res = await authApi.login({ email, password })
          localStorage.setItem('gvn_token', res.token)
          set({ user: res.user, token: res.token, isLoading: false })
          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          return { success: false, error: err.message || 'Invalid credentials' }
        }
      },

      logout: () => {
        localStorage.removeItem('gvn_token')
        set({ user: null, token: null })
      },

      setUser: (user) => set({ user }),

      hasRole: (...roles) => {
        const { user } = get()
        return user ? roles.includes(user.role) : false
      },

      isAdmin: () => get().hasRole('admin'),
    }),
    { name: 'gvn-auth', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
)

export default useAuthStore
