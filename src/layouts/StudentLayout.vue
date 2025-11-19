<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'

const navItems = [
  { name: 'Дашборд', path: '/student/dashboard', icon: '🏠' },
  { name: 'Курсы', path: '/student/courses', icon: '📚' }
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
