<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCasesStore } from '@/stores/cases'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import type { CaseQuestionForStudent, CaseAnswerResult } from '@/types/case'

const route = useRoute()
const casesStore = useCasesStore()
const { success, error: showError } = useToast()

const caseId = computed(() => Number(route.params.id))
const caseItem = computed(() => casesStore.currentCase)
const loading = ref(true)
const activeTab = ref<'info' | 'tests'>('info')
const questions = ref<CaseQuestionForStudent[]>([])
const answers = ref<Record<number, string>>({})
const results = ref<Record<number, CaseAnswerResult>>({})
const submittingAnswers = ref<Record<number, boolean>>({})
const loadingQuestions = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    await casesStore.fetchCase(caseId.value)

    // Пытаемся загрузить вопросы
    await loadQuestions()
  } catch (e) {
    showError('Ошибка загрузки кейса')
  } finally {
    loading.value = false
  }
})

const loadQuestions = async () => {
  loadingQuestions.value = true
  try {
    questions.value = await casesStore.fetchQuestionsForStudent(caseId.value)

    // Инициализируем пустые ответы для всех вопросов
    questions.value.forEach(question => {
      answers.value[question.id] = ''
    })

    // Проверяем для каждого вопроса, есть ли уже сданный результат
    await Promise.all(
      questions.value.map(async (question) => {
        try {
          const result = await casesStore.fetchTestResult(question.id)
          if (result) {
            // Если результат найден, сохраняем его
            results.value[question.id] = result
          }
        } catch (e) {
          // Ошибки при загрузке результатов игнорируем
          console.log(`No result found for test ${question.id}`)
        }
      })
    )
  } catch (e) {
    // Вопросы могут не существовать - это нормально
    console.log('Questions not found')
  } finally {
    loadingQuestions.value = false
  }
}

const submitAnswer = async (questionId: number) => {
  const answer = answers.value[questionId]
  if (!answer || answer.trim().length === 0) {
    showError('Пожалуйста, введите ответ')
    return
  }

  submittingAnswers.value[questionId] = true

  try {
    const result = await casesStore.submitCaseAnswer({
      answer: answer,
      test_id: questionId
    })

    // Сохраняем результат
    results.value[questionId] = result

    success(`Ответ отправлен! Ваша оценка: ${result.score}`)
  } catch (e: any) {
    const errorMessage = e.response?.data?.detail || 'Ошибка отправки ответа'
    showError(errorMessage)
  } finally {
    submittingAnswers.value[questionId] = false
  }
}
</script>

<template>
  <!-- Loading State -->
  <div v-if="loading" class="flex flex-col items-center justify-center py-12">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
    <p class="text-gray-600">Загрузка кейса...</p>
  </div>

  <div v-else-if="caseItem">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ caseItem.title }}</h1>
      <p class="text-gray-600">{{ caseItem.description }}</p>
    </div>

    <!-- Табы -->
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
        @click="activeTab = 'tests'"
        :class="[
          'px-6 py-3 font-medium rounded-lg transition-colors',
          activeTab === 'tests'
            ? 'bg-primary text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        ]"
      >
        📝 Тесты
        <span v-if="questions.length > 0" class="ml-2 text-xs">
          ({{ questions.length }})
        </span>
      </button>
    </div>

    <!-- Info Tab -->
    <AppCard v-if="activeTab === 'info'">
      <div class="space-y-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Информация о кейсе</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Название кейса</label>
              <p class="text-gray-900 text-lg font-semibold">{{ caseItem.title }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Описание</label>
              <p class="text-gray-700">{{ caseItem.description }}</p>
            </div>

            <div v-if="caseItem.cleaning_text">
              <label class="block text-sm font-medium text-gray-700 mb-2">Содержание кейса</label>
              <div class="bg-gray-50 p-6 rounded-lg max-h-96 overflow-y-auto border border-gray-200">
                <p class="whitespace-pre-wrap text-gray-700 leading-relaxed">{{ caseItem.cleaning_text }}</p>
              </div>
            </div>

            <div v-else>
              <label class="block text-sm font-medium text-gray-700 mb-2">Содержание кейса</label>
              <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <p class="text-gray-500 text-center">Содержание кейса не загружено</p>
              </div>
            </div>

            <div class="pt-4 border-t border-gray-200">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label class="block text-gray-500 mb-1">Дата создания</label>
                  <p class="text-gray-900 font-medium">
                    {{ new Date(caseItem.created_at).toLocaleDateString('ru-RU') }}
                  </p>
                </div>
                <div>
                  <label class="block text-gray-500 mb-1">Последнее обновление</label>
                  <p class="text-gray-900 font-medium">
                    {{ new Date(caseItem.updated_at).toLocaleDateString('ru-RU') }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppCard>

    <!-- Tests Tab -->
    <AppCard v-if="activeTab === 'tests'">
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-gray-900">Вопросы по кейсу</h2>
        </div>

        <!-- Loading questions -->
        <div v-if="loadingQuestions" class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4 mx-auto"></div>
          <p class="text-gray-600">Загрузка вопросов...</p>
        </div>

        <!-- Questions list -->
        <div v-else-if="questions.length > 0" class="space-y-6">
          <div
            v-for="(question, index) in questions"
            :key="question.id"
            class="p-6 border border-gray-200 rounded-lg bg-white"
          >
            <div class="mb-4">
              <div class="flex items-start justify-between mb-3">
                <h3 class="text-lg font-semibold text-gray-900">Вопрос {{ index + 1 }}</h3>
                <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">ID: {{ question.id }}</span>
              </div>
              <p class="text-gray-800 leading-relaxed">{{ question.question }}</p>
            </div>

            <!-- Если ответ уже отправлен, показываем результат -->
            <div v-if="results[question.id]" class="space-y-4">
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-center mb-3">
                  <svg class="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 class="text-lg font-semibold text-green-900">Ответ отправлен!</h4>
                </div>
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-green-700">Ваша оценка:</span>
                    <span class="text-2xl font-bold text-green-900">{{ results[question.id].score }}</span>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-green-700 mb-1">Ваш ответ:</label>
                    <p class="text-sm text-green-800 bg-white p-3 rounded border border-green-200">
                      {{ results[question.id].answer }}
                    </p>
                  </div>
                  <p class="text-xs text-green-600 mt-2">
                    Отправлено: {{ new Date(results[question.id].created_at).toLocaleString('ru-RU') }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Иначе показываем форму для ввода ответа -->
            <div v-else class="space-y-3">
              <label class="block text-sm font-medium text-gray-700">
                Ваш ответ:
              </label>
              <textarea
                v-model="answers[question.id]"
                rows="4"
                :disabled="submittingAnswers[question.id]"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:bg-gray-100"
                placeholder="Введите ваш ответ здесь..."
              ></textarea>

              <div class="flex justify-end">
                <AppButton
                  @click="submitAnswer(question.id)"
                  :loading="submittingAnswers[question.id]"
                  :disabled="!answers[question.id] || answers[question.id].trim().length === 0 || submittingAnswers[question.id]"
                >
                  <span v-if="submittingAnswers[question.id]">Отправка...</span>
                  <span v-else>Отправить ответ</span>
                </AppButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="text-center py-12">
          <div class="text-6xl mb-4">📝</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Вопросы не найдены</h3>
          <p class="text-gray-600">
            Для этого кейса еще не созданы вопросы
          </p>
        </div>
      </div>
    </AppCard>
  </div>
</template>
