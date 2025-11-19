<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'

const navItems = [
  { name: 'Дашборд', path: '/methodist/dashboard', icon: '📊' },
  { name: 'Курсы', path: '/methodist/courses', icon: '📚' },
  { name: 'Результаты', path: '/methodist/results', icon: '📈' }
]
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    <div class="flex">
      <AppSidebar :items="navItems" />
      <main class="flex-1 p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>
