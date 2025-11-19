<script setup lang="ts">
import { useRoute } from 'vue-router'

interface NavItem {
  name: string
  path: string
  icon: string
}

interface Props {
  items: NavItem[]
}

defineProps<Props>()

const route = useRoute()
</script>

<template>
  <aside class="w-64 bg-white border-r border-gray-200 min-h-screen">
    <nav class="p-4 space-y-2">
      <router-link
        v-for="item in items"
        :key="item.path"
        :to="item.path"
        :class="[
          'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
          route.path === item.path
            ? 'bg-primary text-white'
            : 'text-gray-700 hover:bg-gray-100'
        ]"
      >
        <span class="text-xl">{{ item.icon }}</span>
        <span class="font-medium">{{ item.name }}</span>
      </router-link>
    </nav>
  </aside>
</template>
