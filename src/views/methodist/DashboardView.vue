<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCoursesStore } from '@/stores/courses'
import { useTestsStore } from '@/stores/tests'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const coursesStore = useCoursesStore()
const testsStore = useTestsStore()

const stats = ref({
  totalCourses: 0,
  publishedCourses: 0,
  totalTests: 0,
  totalResults: 0
})

onMounted(async () => {
  await coursesStore.fetchCourses()
  await testsStore.fetchResults()

  stats.value = {
    totalCourses: coursesStore.courses.length,
    publishedCourses: coursesStore.courses.filter(c => c.status === 'published').length,
    totalTests: coursesStore.courses.filter(c => c.test).length,
    totalResults: testsStore.testResults.length
  }
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Дашборд методиста</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <AppCard>
        <div class="text-center">
          <p class="text-4xl font-bold text-primary mb-2">{{ stats.totalCourses }}</p>
          <p class="text-gray-600">Всего курсов</p>
        </div>
      </AppCard>

      <AppCard>
        <div class="text-center">
          <p class="text-4xl font-bold text-success mb-2">{{ stats.publishedCourses }}</p>
          <p class="text-gray-600">Опубликовано</p>
        </div>
      </AppCard>

      <AppCard>
        <div class="text-center">
          <p class="text-4xl font-bold text-secondary mb-2">{{ stats.totalTests }}</p>
          <p class="text-gray-600">Тестов создано</p>
        </div>
      </AppCard>

      <AppCard>
        <div class="text-center">
          <p class="text-4xl font-bold text-danger mb-2">{{ stats.totalResults }}</p>
          <p class="text-gray-600">Результатов</p>
        </div>
      </AppCard>
    </div>

    <AppCard title="Быстрые действия">
      <div class="space-y-3">
        <AppButton @click="router.push('/methodist/courses/create')" class="w-full">
          ➕ Создать новый курс
        </AppButton>
        <AppButton @click="router.push('/methodist/courses')" variant="secondary" class="w-full">
          📚 Посмотреть все курсы
        </AppButton>
        <AppButton @click="router.push('/methodist/results')" variant="secondary" class="w-full">
          📈 Посмотреть результаты
        </AppButton>
      </div>
    </AppCard>
  </div>
</template>
