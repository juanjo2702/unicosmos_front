import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import apiClient from '../api/client'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      token: null,
      isLoading: false,
      error: null,

      // Acciones
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Registro
      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const data = await apiClient.post('/api/auth/register', userData)

          set({ 
            user: data.user,
            token: data.token,
            isLoading: false 
          })

          return { success: true, data }
        } catch (error) {
          set({ 
            error: error.message,
            isLoading: false 
          })
          return { success: false, error: error.message }
        }
      },

      // Login
      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const data = await apiClient.post('/api/auth/login', { email, password })

          set({ 
            user: data.user,
            token: data.token,
            isLoading: false 
          })

          return { success: true, data }
        } catch (error) {
          set({ 
            error: error.message,
            isLoading: false 
          })
          return { success: false, error: error.message }
        }
      },

      // Logout
      logout: async () => {
        const { token } = get()
        if (token) {
          try {
            await apiClient.post('/api/auth/logout', {})
          } catch (error) {
            console.error('Error al cerrar sesión:', error)
          }
        }
        
        set({ 
          user: null,
          token: null,
          error: null 
        })
      },

      // Verificar autenticación
      checkAuth: async () => {
        const { token } = get()
        if (!token) return false

        try {
          const user = await apiClient.get('/api/auth/user')
          set({ user })
          return true
        } catch (error) {
          get().logout()
          return false
        }
      },

      // Selectores
      isAuthenticated: () => !!get().token,
      getUserRole: () => get().user?.role,
      isAdmin: () => get().user?.role === 'admin',
      isPresenter: () => get().user?.role === 'presenter',
      isPlayer: () => get().user?.role === 'player',
    }),
    {
      name: 'auth-storage', // nombre para localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export default useAuthStore