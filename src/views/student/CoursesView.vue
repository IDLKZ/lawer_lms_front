<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCoursesStore } from '@/stores/courses'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const coursesStore = useCoursesStore()
const { error: showError } = useToast()

const searchQuery = ref('')

const publishedCourses = computed(() => {
  const courses = coursesStore.courses.filter(c => c.status === 'published')

  if (!searchQuery.value) return courses

  return courses.filter(c =>
    c.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

onMounted(async () => {
  try {
    await coursesStore.fetchCourses()
  } catch (e) {
    showError('Ошибка загрузки курсов')
  }
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Все курсы</h1>

    <AppCard class="mb-6">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск курсов..."
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </AppCard>

    <div v-if="publishedCourses.length === 0" class="text-center py-12">
      <AppCard>
        <p class="text-gray-500">
          {{ searchQuery ? 'Курсы не найдены' : 'Пока нет доступных курсов' }}
        </p>
      </AppCard>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AppCard v-for="course in publishedCourses" :key="course.id">
        <div class="space-y-4">
          <div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ course.title }}</h3>
            <p class="text-gray-600">{{ course.description }}</p>
          </div>

          <div class="flex items-center space-x-3 text-sm">
            <span v-if="course.summary" class="flex items-center text-green-600">
              <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Конспект
            </span>
            <span v-if="course.test" class="flex items-center text-blue-600">
              <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              Тест
            </span>
          </div>

          <AppButton @click="router.push(`/student/courses/${course.id}`)" class="w-full">
            Открыть курс
          </AppButton>
        </div>
      </AppCard>
    </div>
  </div>
</template>
