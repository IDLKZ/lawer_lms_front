import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// Создаем axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    }
})

// Request Interceptor: добавление JWT токена
api.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
})

// Response Interceptor: обработка 401 ошибки
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Проверяем 401 ошибку (Unauthorized)
    if (error.response?.status === 401) {
      const authStore = useAuthStore()

      // Очищаем хранилище
      authStore.logout()

      // Перенаправляем на страницу логина
      router.push('/login')
    }

    // Пробрасываем ошибку дальше
    return Promise.reject(error)
  }
)

// Composable для использования в компонентах
export function useApi() {
  return api
}
