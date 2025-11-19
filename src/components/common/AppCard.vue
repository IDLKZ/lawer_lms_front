<script setup lang="ts">
interface Props {
  title?: string
  padding?: boolean
}

withDefaults(defineProps<Props>(), {
  padding: true
})
</script>

<template>
  <div class="bg-white rounded-lg shadow-md border border-gray-200">
    <div v-if="title" class="px-6 py-4 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
    </div>
    <div :class="padding ? 'p-6' : ''">
      <slot />
    </div>
  </div>
</template>
