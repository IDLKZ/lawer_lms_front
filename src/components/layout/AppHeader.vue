<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const { user, logout } = useAuth()
</script>

<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <h1 class="text-xl font-bold text-primary">LMS Система</h1>
        </div>

        <div class="flex items-center space-x-4">
          <div class="text-sm">
            <p class="font-medium text-gray-900">{{ user?.full_name }}</p>
            <p class="text-gray-500">{{ user?.role === 'methodist' ? 'Методист' : 'Студент' }}</p>
          </div>
          <button
            @click="logout"
            class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Выйти
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
