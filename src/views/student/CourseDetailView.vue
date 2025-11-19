<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCoursesStore } from '@/stores/courses'
import { useTestsStore } from '@/stores/tests'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'

const route = useRoute()
const router = useRouter()
const coursesStore = useCoursesStore()
const testsStore = useTestsStore()
const { error: showError } = useToast()

const courseId = computed(() => Number(route.params.id))
const course = computed(() => coursesStore.currentCourse)
const testResult = computed(() => testsStore.currentResult)
const activeTab = ref<'info' | 'summary' | 'test'>('info')
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  try {
    await coursesStore.fetchCourse(courseId.value)

    // Загружаем конспект и тест
    try {
      await coursesStore.fetchSummary(courseId.value)
    } catch (e) {
      // Конспект может не существовать - это нормально
      console.log('Summary not found')
    }

    try {
      await coursesStore.fetchTestForStudent(courseId.value)
    } catch (e) {
      // Тест может не существовать - это нормально
      console.log('Test not found')
    }

    // Проверяем есть ли результаты теста у студента
    try {
      await testsStore.fetchMyResultsByCourse(courseId.value)
    } catch (e) {
      // Результатов нет - это нормально
      console.log('No test results found')
    }
  } catch (e) {
    showError('Ошибка загрузки курса')
  } finally {
    loading.value = false
  }
})

const startTest = () => {
  if (course.value?.test) {
    router.push(`/student/tests/${course.value.test.id}`)
  }
}
</script>

<template>
  <!-- Loading State -->
  <div v-if="loading" class="flex flex-col items-center justify-center py-12">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
    <p class="text-gray-600">Загрузка курса...</p>
  </div>

  <div v-else-if="course">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ course.title }}</h1>
      <p class="text-gray-600">{{ course.description }}</p>
    </div>

    <div class="flex space-x-4 mb-6">
      <button
        @click="activeTab = 'info'"
        :class="[
          'px-6 py-3 font-medium rounded-lg transition-colors',
          activeTab === 'info'
            ? 'bg-primary text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        ]"
      >
        ℹ️ Информация
      </button>
      <button
        v-if="course.summary"
        @click="activeTab = 'summary'"
        :class="[
          'px-6 py-3 font-medium rounded-lg transition-colors',
          activeTab === 'summary'
            ? 'bg-primary text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        ]"
      >
        📖 Конспект
      </button>
      <button
        v-if="course.test"
        @click="activeTab = 'test'"
        :class="[
          'px-6 py-3 font-medium rounded-lg transition-colors',
          activeTab === 'test'
            ? 'bg-primary text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        ]"
      >
        📝 Тест
      </button>
    </div>

    <!-- Info Tab -->
    <AppCard v-if="activeTab === 'info'">
      <div class="space-y-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Информация о курсе</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Название курса</label>
              <p class="text-gray-900 text-lg font-semibold">{{ course.title }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Описание</label>
              <p class="text-gray-700">{{ course.description }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Материал курса</label>

              <!-- Текстовый материал -->
              <div v-if="course.original_text" class="bg-gray-50 p-6 rounded-lg max-h-96 overflow-y-auto border border-gray-200">
                <p class="whitespace-pre-wrap text-gray-700 leading-relaxed">{{ course.original_text }}</p>
              </div>

              <!-- Файл -->
              <div v-else-if="course.file_url" class="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                <div class="flex items-center space-x-3">
                  <svg class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div class="flex-1">
                    <p class="text-gray-900 font-medium mb-1">Материал курса доступен для скачивания</p>
                    <p class="text-sm text-gray-600">Откройте файл для изучения материала</p>
                  </div>
                  <a
                    :href="course.file_url"
                    target="_blank"
                    class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    📄 Открыть файл
                  </a>
                </div>
              </div>

              <!-- Нет материала -->
              <div v-else class="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <p class="text-gray-500 text-center">Материал курса не загружен</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppCard>

    <!-- Summary Tab -->
    <AppCard v-if="activeTab === 'summary' && course.summary">
      <div class="prose max-w-none">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Конспект курса</h2>
        <div class="whitespace-pre-wrap text-gray-700 leading-relaxed">
          {{ course.summary.content }}
        </div>
      </div>
    </AppCard>

    <AppCard v-else-if="activeTab === 'summary' && !course.summary">
      <p class="text-gray-500 text-center py-8">
        Конспект еще не создан для этого курса
      </p>
    </AppCard>

    <!-- Test Tab -->
    <AppCard v-if="activeTab === 'test' && course.test">
      <!-- Если есть результат - показываем его -->
      <div v-if="testResult" class="space-y-6">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Результаты тестирования</h2>

          <div class="max-w-2xl mx-auto">
            <div class="flex items-center justify-center mb-6">
              <div class="inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold bg-blue-100 text-blue-800">
                {{ testResult.percentage }}%
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">Правильных ответов</p>
                <p class="text-2xl font-bold text-gray-900">{{ testResult.score }}</p>
              </div>
              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">Всего вопросов</p>
                <p class="text-2xl font-bold text-gray-900">{{ testResult.total_questions }}</p>
              </div>
            </div>

            <p class="text-sm text-gray-500 mb-6">
              Тест сдан: {{ new Date(testResult.submitted_at).toLocaleString('ru-RU') }}
            </p>
          </div>
        </div>

        <!-- Детальный разбор ответов -->
        <div>
          <h3 class="text-xl font-bold text-gray-900 mb-4">Детальный разбор</h3>

          <div class="space-y-4">
            <AppCard v-for="(answer, index) in testResult.answers" :key="answer.question_id">
              <div class="space-y-3">
                <div class="flex items-start justify-between">
                  <h4 class="text-lg font-semibold text-gray-900">
                    Вопрос {{ index + 1 }}
                  </h4>
                  <span
                    :class="[
                      'px-3 py-1 text-xs font-medium rounded-full',
                      answer.is_correct
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    ]"
                  >
                    {{ answer.is_correct ? '✓ Правильно' : '✗ Неправильно' }}
                  </span>
                </div>

                <p class="text-gray-900 font-medium">{{ answer.question }}</p>

                <div class="space-y-2">
                  <div
                    v-for="(option, optIndex) in answer.options"
                    :key="optIndex"
                    :class="[
                      'p-3 border rounded-lg transition-colors',
                      option === answer.correct_answer
                        ? 'border-green-500 bg-green-50'
                        : option === answer.selected_answer && !answer.is_correct
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    ]"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-gray-900">{{ option }}</span>
                      <div class="flex items-center space-x-2">
                        <span
                          v-if="option === answer.selected_answer"
                          class="text-xs font-medium text-gray-600"
                        >
                          Ваш ответ
                        </span>
                        <span
                          v-if="option === answer.correct_answer"
                          class="text-xs font-medium text-green-700"
                        >
                          Правильный ответ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AppCard>
          </div>
        </div>
      </div>

      <!-- Если результата нет - показываем кнопку начала теста -->
      <div v-else class="text-center space-y-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Тестирование</h2>
          <p class="text-gray-600">
            Тест содержит {{ course.test.questions.length }} вопросов
          </p>
        </div>

        <div class="max-w-md mx-auto">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 class="font-semibold text-blue-900 mb-2">Инструкция:</h3>
            <ul class="text-sm text-blue-800 space-y-1 text-left">
              <li>• Внимательно прочитайте каждый вопрос</li>
              <li>• Выберите один правильный ответ</li>
              <li>• Для зачета нужно набрать минимум 70%</li>
              <li>• Удачи!</li>
            </ul>
          </div>

          <AppButton @click="startTest" class="w-full" size="lg">
            Начать тест
          </AppButton>
        </div>
      </div>
    </AppCard>

    <AppCard v-else-if="activeTab === 'test' && !course.test">
      <p class="text-gray-500 text-center py-8">
        Тест еще не создан для этого курса
      </p>
    </AppCard>
  </div>
</template>
