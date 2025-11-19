<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const { success, error: showError } = useToast()

const email = ref('')
const password = ref('')
const fullName = ref('')
const role = ref<'student' | 'methodist'>('student')
const loading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  error.value = ''
  loading.value = true

  try {
    await authStore.register({
      email: email.value,
      password: password.value,
      full_name: fullName.value,
      role: role.value
    })
    success('Регистрация успешна! Войдите в систему')
    router.push('/login')
  } catch (e: any) {
    error.value = e.response?.data?.detail || 'Ошибка регистрации'
    showError(error.value)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Регистрация</h2>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <AppInput
        v-model="email"
        type="email"
        label="Email"
        placeholder="Введите email"
      />

      <AppInput
        v-model="password"
        type="password"
        label="Пароль"
        placeholder="Введите пароль"
      />

      <AppInput
        v-model="fullName"
        type="text"
        label="ФИО"
        placeholder="Введите ФИО"
      />

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Роль</label>
        <div class="space-y-2">
          <label class="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              v-model="role"
              value="student"
              class="w-4 h-4 text-primary focus:ring-primary"
            />
            <span class="text-gray-700">Студент</span>
          </label>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              v-model="role"
              value="methodist"
              class="w-4 h-4 text-primary focus:ring-primary"
            />
            <span class="text-gray-700">Методист</span>
          </label>
        </div>
      </div>

      <AppButton
        type="submit"
        :loading="loading"
        :disabled="!email || !password || !fullName"
        class="w-full"
      >
        Зарегистрироваться
      </AppButton>
    </form>

    <div class="mt-6 text-center">
      <p class="text-sm text-gray-600">
        Уже есть аккаунт?
        <router-link to="/login" class="text-primary hover:text-blue-600 font-medium">
          Войти
        </router-link>
      </p>
    </div>
  </div>
</template>
