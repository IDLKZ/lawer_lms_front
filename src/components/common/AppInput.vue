<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'

interface Props {
  modelValue: string | number
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea'
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  rows?: number
  autoResize?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  rows: 4,
  autoResize: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)

const updateValue = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('update:modelValue', props.type === 'number' ? Number(target.value) : target.value)

  if (props.autoResize && props.type === 'textarea') {
    adjustTextareaHeight()
  }
}

const adjustTextareaHeight = () => {
  if (!textareaRef.value) return

  // Сбрасываем высоту чтобы получить правильный scrollHeight
  textareaRef.value.style.height = 'auto'
  // Устанавливаем высоту на основе scrollHeight
  textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
}

onMounted(() => {
  if (props.autoResize && props.type === 'textarea') {
    nextTick(() => {
      adjustTextareaHeight()
    })
  }
})

watch(() => props.modelValue, () => {
  if (props.autoResize && props.type === 'textarea') {
    nextTick(() => {
      adjustTextareaHeight()
    })
  }
})
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
      {{ label }}
    </label>

    <textarea
      v-if="type === 'textarea'"
      ref="textareaRef"
      :value="modelValue"
      @input="updateValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      :class="[
        'w-full px-3 sm:px-4 py-2.5 sm:py-3 border rounded-xl text-sm sm:text-base',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
        'transition-all duration-200',
        'placeholder:text-gray-400',
        error ? 'border-danger' : 'border-gray-300 hover:border-gray-400',
        disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white',
        autoResize ? 'resize-none overflow-hidden' : ''
      ]"
    />

    <input
      v-else
      :type="type"
      :value="modelValue"
      @input="updateValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="[
        'w-full px-4 py-3 border border-gray-200 text-sm sm:text-base',
        'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
        'transition-all duration-200',
        'placeholder:text-gray-400',
        'touch-manipulation',
        'bg-gray-50 hover:bg-white',
        error ? 'border-danger' : '',
        disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
      ]"
    />

    <p v-if="error" class="mt-1.5 text-xs sm:text-sm text-danger">
      {{ error }}
    </p>
  </div>
</template>
