<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'

const { login } = useAuth()
const { error: showError } = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleSubmit = async () => {
  error.value = ''
  loading.value = true

  try {
    await login(email.value, password.value)
  } catch (e: any) {
    error.value = e.response?.data?.detail || 'Ошибка авторизации'
    showError(error.value)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="animate-fade-in">
    <h2 class="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 sm:mb-10 text-center tracking-wide uppercase">
      Добро пожаловать!
    </h2>

    <!-- Сообщение об ошибке -->
    <div v-if="error" class="mb-5 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm animate-shake">
      {{ error }}
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-5">
      <!-- Email поле -->
      <div>
        <AppInput
          v-model="email"
          type="email"
          placeholder="E-Mail"
          :disabled="loading"
        />
      </div>

      <!-- Поле пароля -->
      <div>
        <AppInput
          v-model="password"
          type="password"
          placeholder="Password"
          :disabled="loading"
        />
      </div>

      <!-- Кнопка входа -->
      <AppButton
        type="submit"
        :loading="loading"
        :disabled="!email || !password || loading"
        class="w-full !mt-8"
        size="lg"
      >
        <span v-if="!loading" class="uppercase tracking-wider font-semibold">Войти</span>
        <span v-else>Вход...</span>
      </AppButton>
    </form>

    <!-- Ссылки внизу -->
    <div class="flex justify-between items-center mt-8 text-sm">
      <router-link
        to="/register"
        class="text-primary hover:text-blue-700 font-medium transition-colors"
      >
        Нет аккаунта?
      </router-link>
      <a href="#" class="text-gray-500 hover:text-gray-700 transition-colors">
        Забыли пароль?
      </a>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-5px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(5px);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}
</style>
