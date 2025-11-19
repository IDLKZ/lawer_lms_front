<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useTestsStore } from '@/stores/tests'
import { useCoursesStore } from '@/stores/courses'
import { useToast } from '@/composables/useToast'
import { useApi } from '@/composables/useApi'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'

const testsStore = useTestsStore()
const coursesStore = useCoursesStore()
const { error: showError } = useToast()
const api = useApi()

const filterCourseId = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)

const totalPages = ref(1)

const fetchData = async () => {
  loading.value = true
  try {
    const params: { skip?: number; limit?: number; course_id?: number } = {
      skip: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value
    }

    if (filterCourseId.value) {
      params.course_id = filterCourseId.value
    }

    await testsStore.fetchResults(params)

    // Примерный расчет общего количества страниц
    // (в реальном приложении сервер должен возвращать total count)
    if (testsStore.testResults.length < pageSize.value) {
      totalPages.value = currentPage.value
    } else {
      totalPages.value = currentPage.value + 1
    }
  } catch (e) {
    showError('Ошибка загрузки результатов')
  } finally {
    loading.value = false
  }
}

// При изменении фильтра курса или размера страницы - сбрасываем на первую страницу
watch([filterCourseId, pageSize], () => {
  currentPage.value = 1
})

// При изменении любого параметра - загружаем данные
watch([filterCourseId, currentPage, pageSize], () => {
  fetchData()
})

onMounted(async () => {
  try {
    await coursesStore.fetchCourses()
    await fetchData()
  } catch (e) {
    showError('Ошибка загрузки данных')
  }
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const exportToCSV = async () => {
  try {
    const params = new URLSearchParams()
    if (filterCourseId.value) {
      params.append('course_id', filterCourseId.value.toString())
    }

    const url = params.toString() ? `/results/export?${params.toString()}` : '/results/export'

    const response = await api.get(url, {
      responseType: 'blob'
    })

    // Создаем blob из ответа
    const blob = new Blob([response.data], { type: 'text/csv' })
    const downloadUrl = URL.createObjectURL(blob)

    // Создаем ссылку для скачивания
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `test_results_${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()

    // Очищаем
    document.body.removeChild(a)
    URL.revokeObjectURL(downloadUrl)
  } catch (e) {
    showError('Ошибка экспорта данных')
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchData()
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Результаты тестирования</h1>
      <AppButton @click="exportToCSV" variant="success">
        📥 Экспорт в CSV
      </AppButton>
    </div>

    <AppCard class="mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center space-x-2">
          <span class="text-sm font-medium text-gray-700">Курс:</span>
          <select
            v-model.number="filterCourseId"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option :value="null">Все курсы</option>
            <option v-for="course in coursesStore.courses" :key="course.id" :value="course.id">
              {{ course.title }}
            </option>
          </select>
        </div>

        <div class="flex items-center space-x-2">
          <span class="text-sm font-medium text-gray-700">На странице:</span>
          <select
            v-model.number="pageSize"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>
      </div>
    </AppCard>

    <AppCard :padding="false">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Студент ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Курс</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Балл</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-if="loading">
              <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                <div class="flex items-center justify-center">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span class="ml-3">Загрузка...</span>
                </div>
              </td>
            </tr>
            <template v-else>
              <tr v-for="result in testsStore.testResults" :key="result.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 text-sm text-gray-900">
                  #{{ result.student?.full_name }}
                </td>
                <td class="px-6 py-4">
                  <p class="text-sm font-medium text-gray-900">
                    {{ coursesStore.courses.find(c => c.id === result.test?.course_id)?.title || 'N/A' }}
                  </p>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ result.score }} / {{ result.total_questions }}
                </td>
                <td class="px-6 py-4">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-medium rounded-full',
                      result.passed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    ]"
                  >
                    {{ result.passed ? 'Зачет' : 'Незачет' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                  {{ formatDate(result.submitted_at) }}
                </td>
              </tr>
              <tr v-if="testsStore.testResults.length === 0">
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                  Нет результатов
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </AppCard>

    <!-- Пагинация -->
    <AppCard v-if="!loading && testsStore.testResults.length > 0" class="mt-6">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-700">
          Страница {{ currentPage }} из {{ totalPages }}
        </div>
        <div class="flex space-x-2">
          <AppButton
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            variant="secondary"
            size="sm"
          >
            ← Назад
          </AppButton>
          <AppButton
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages || testsStore.testResults.length < pageSize"
            variant="secondary"
            size="sm"
          >
            Вперед →
          </AppButton>
        </div>
      </div>
    </AppCard>
  </div>
</template>
