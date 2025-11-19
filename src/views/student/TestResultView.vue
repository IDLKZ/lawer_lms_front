<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTestsStore } from '@/stores/tests'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'

const route = useRoute()
const router = useRouter()
const testsStore = useTestsStore()
const { error: showError } = useToast()

const testId = computed(() => Number(route.params.id))
const result = computed(() => testsStore.currentResult)
const test = computed(() => testsStore.currentTest)

onMounted(async () => {
  try {
    //@ts-ignore
    await testsStore.fetchMyResultsByCourse(route.params.id)
    // Если результата нет, перенаправляем обратно
    if (!testsStore.currentResult) {
      await router.push('/student/courses')
    }
  } catch (e) {
    showError('Ошибка загрузки результатов')
  }
})
</script>

<template>
  <div v-if="result">
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">Результаты тестирования</h1>

      <AppCard class="max-w-2xl mx-auto">
        <div class="text-center space-y-6">
          <div>
            <div class="inline-flex items-center justify-center w-32 h-32 rounded-full text-4xl font-bold mb-4 bg-blue-100 text-blue-800">
              {{ Math.round(result.percentage) }}%
            </div>
            <p class="text-2xl font-bold text-gray-900">Тест завершен</p>
          </div>

          <div class="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div class="bg-gray-50 p-4 rounded-lg">
              <p class="text-sm text-gray-600 mb-1">Правильных ответов</p>
              <p class="text-3xl font-bold text-gray-900">{{ result.score }}</p>
            </div>
            <div class="bg-gray-50 p-4 rounded-lg">
              <p class="text-sm text-gray-600 mb-1">Всего вопросов</p>
              <p class="text-3xl font-bold text-gray-900">{{ result.total_questions }}</p>
            </div>
          </div>

          <p class="text-sm text-gray-500">
            Тест сдан: {{ new Date(result.submitted_at).toLocaleString('ru-RU') }}
          </p>

          <div class="flex justify-center space-x-3">
            <AppButton @click="router.push('/student/courses')" variant="secondary">
              К курсам
            </AppButton>
            <AppButton @click="router.push('/student/dashboard')">
              На главную
            </AppButton>
          </div>
        </div>
      </AppCard>
    </div>

    <!-- Детальный разбор ответов -->
    <div v-if="result.answers" class="max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Детальный разбор</h2>

      <div class="space-y-4">
        <AppCard v-for="(answer, index) in result.answers" :key="answer.question_id">
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
</template>
