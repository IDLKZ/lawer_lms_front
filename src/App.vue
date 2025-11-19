<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()
</script>

<template>
  <div id="app">
    <router-view />

    <!-- Toast Notifications -->
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <transition-group name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'px-6 py-4 rounded-lg shadow-lg max-w-sm',
            toast.type === 'success' && 'bg-green-500 text-white',
            toast.type === 'error' && 'bg-red-500 text-white',
            toast.type === 'info' && 'bg-blue-500 text-white',
            toast.type === 'warning' && 'bg-yellow-500 text-white'
          ]"
        >
          <div class="flex items-center justify-between">
            <p class="font-medium">{{ toast.message }}</p>
            <button
              @click="remove(toast.id)"
              class="ml-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<style>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>
