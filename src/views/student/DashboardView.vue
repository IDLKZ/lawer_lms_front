<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCoursesStore } from '@/stores/courses'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const coursesStore = useCoursesStore()
const { error: showError } = useToast()

const publishedCourses = ref<any[]>([])

onMounted(async () => {
  try {
    await coursesStore.fetchCourses()
    publishedCourses.value = coursesStore.courses
      .filter(c => c.status === 'published')
      .slice(0, 3)
  } catch (e) {
    showError('Ошибка загрузки курсов')
  }
})
</script>

<template>
  <div>
    <AppCard class="mb-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
      <div class="py-6">
        <h1 class="text-3xl font-bold mb-2">
          Добро пожаловать, {{ authStore.user?.full_name }}!
        </h1>
        <p class="text-blue-100">
          Продолжайте обучение и развивайте свои навыки
        </p>
      </div>
    </AppCard>

    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold text-gray-900">Доступные курсы</h2>
        <AppButton @click="router.push('/student/courses')" variant="secondary">
          Все курсы →
        </AppButton>
      </div>

      <div v-if="publishedCourses.length === 0" class="text-center py-12">
        <p class="text-gray-500 mb-4">Пока нет доступных курсов</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AppCard v-for="course in publishedCourses" :key="course.id">
          <div class="space-y-3">
            <h3 class="text-lg font-semibold text-gray-900">{{ course.title }}</h3>
            <p class="text-sm text-gray-600">{{ course.description }}</p>
            <div class="flex items-center space-x-2 text-sm text-gray-500">
              <span v-if="course.summary">✅ Конспект</span>
              <span v-if="course.test">✅ Тест</span>
            </div>
            <AppButton
              @click="router.push(`/student/courses/${course.id}`)"
              class="w-full"
              size="sm"
            >
              Открыть курс
            </AppButton>
          </div>
        </AppCard>
      </div>
    </div>
  </div>
</template>
