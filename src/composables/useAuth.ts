import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  const login = async (email: string, password: string) => {
    await authStore.login(email, password)
    if (authStore.user?.role === 'methodist') {
      router.push('/methodist/dashboard')
    } else {
      router.push('/student/dashboard')
    }
  }

  const logout = () => {
    authStore.logout()
    router.push('/login')
  }

  return {
    user: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    login,
    logout
  }
}
