import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/composables/useApi'
import type { User, RegisterRequest, AuthResponse } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password
    })
    token.value = response.data.access_token
    localStorage.setItem('token', response.data.access_token)
    await fetchUser()
  }

  async function register(data: RegisterRequest) {
    await api.post('/auth/register', data)
  }

  async function fetchUser() {
    if (!token.value) return

    const response = await api.get<User>('/auth/me')
    user.value = response.data
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  // Инициализация: загрузить пользователя если есть токен
  if (token.value) {
    fetchUser().catch(() => {
      // Токен невалиден - interceptor уже обработал logout
    })
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    register,
    fetchUser,
    logout
  }
})
