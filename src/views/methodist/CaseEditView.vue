<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCasesStore } from '@/stores/cases'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppModal from '@/components/common/AppModal.vue'
import type { CaseAnswerResult } from '@/types/case'
import type { User } from '@/types/auth'

const route = useRoute()
const router = useRouter()
const casesStore = useCasesStore()
const { success, error: showError } = useToast()

const caseId = computed(() => Number(route.params.id))
const caseItem = computed(() => casesStore.currentCase)
const activeTab = ref<'info' | 'questions' | 'results'>('info')
const publishModal = ref(false)
const generateModal = ref(false)
const deleteQuestionModal = ref(false)
const questionToDelete = ref<number | null>(null)

// Поля для редактирования кейса
const caseTitle = ref('')
const caseDescription = ref('')
const caseCleaningText = ref('')
const caseStatus = ref<'draft' | 'published'>('draft')
const savingCase = ref(false)
const publishing = ref(false)
const generatingQuestions = ref(false)
const deletingQuestion = ref(false)
const questionCount = ref(10)

// Результаты
const results = ref<CaseAnswerResult[]>([])
const students = ref<Record<number, User>>({})
const loadingResults = ref(false)
const editingScores = ref<Record<number, boolean>>({})
const newScores = ref<Record<number, number>>({})
const updatingScores = ref<Record<number, boolean>>({})

// Группировка результатов по вопросам
const resultsByQuestion = computed(() => {
  const grouped: Record<number, { question: any; results: Array<CaseAnswerResult & { student?: User }> }> = {}

  results.value.forEach(result => {
    if (!grouped[result.test_id]) {
      // Находим вопрос по test_id
      const question = caseItem.value?.questions?.find(q => q.id === result.test_id)
      grouped[result.test_id] = {
        question,
        results: []
      }
    }

    // Добавляем результат с информацией о студенте
    grouped[result.test_id].results.push({
      ...result,
      student: students.value[result.student_id]
    })
  })

  return grouped
})

const loadResults = async () => {
  loadingResults.value = true
  try {
    results.value = await casesStore.fetchCaseResults(caseId.value)

    // Получаем информацию о студентах
    const studentIds = [...new Set(results.value.map(r => r.student_id))]
    await Promise.all(
      studentIds.map(async (studentId) => {
        try {
          const student = await casesStore.fetchUser(studentId)
          if (student) {
            students.value[studentId] = student
          }
        } catch (e) {
          console.log(`Error fetching student ${studentId}`)
        }
      })
    )
  } catch (e) {
    console.log('No results found or error loading results')
  } finally {
    loadingResults.value = false
  }
}

const startEditingScore = (resultId: number, currentScore: number) => {
  editingScores.value[resultId] = true
  newScores.value[resultId] = currentScore
}

const cancelEditingScore = (resultId: number) => {
  editingScores.value[resultId] = false
  delete newScores.value[resultId]
}

const updateScore = async (resultId: number) => {
  const newScore = newScores.value[resultId]

  if (newScore === undefined || newScore < 0 || newScore > 100) {
    showError('Оценка должна быть от 0 до 100')
    return
  }

  updatingScores.value[resultId] = true
  try {
    const updatedResult = await casesStore.updateTestScore(resultId, newScore)

    // Обновляем результат в списке
    const index = results.value.findIndex(r => r.id === resultId)
    if (index !== -1) {
      results.value[index] = updatedResult
    }

    editingScores.value[resultId] = false
    delete newScores.value[resultId]

    success('Оценка успешно обновлена!')
  } catch (e: any) {
    const errorMessage = e.response?.data?.detail || 'Ошибка обновления оценки'
    showError(errorMessage)
  } finally {
    updatingScores.value[resultId] = false
  }
}

onMounted(async () => {
  try {
    await casesStore.fetchCase(caseId.value)
    if (caseItem.value) {
      // Загружаем данные кейса для редактирования
      caseTitle.value = caseItem.value.title
      caseDescription.value = caseItem.value.description
      caseCleaningText.value = caseItem.value.cleaning_text || ''
      caseStatus.value = caseItem.value.status
    }

    // Пытаемся загрузить вопросы
    try {
      await casesStore.fetchQuestions(caseId.value)
    } catch (e) {
      // Вопросы могут не существовать - это нормально
      console.log('Questions not found')
    }
  } catch (e) {
    showError('Ошибка загрузки кейса')
  }
})

const saveCase = async () => {
  if (!caseTitle.value || !caseDescription.value) {
    showError('Название и описание обязательны для заполнения')
    return
  }

  savingCase.value = true
  try {
    await casesStore.updateCase(caseId.value, {
      title: caseTitle.value,
      description: caseDescription.value,
      cleaning_text: caseCleaningText.value
    })
    success('Кейс успешно сохранен')
  } catch (e) {
    showError('Ошибка сохранения кейса')
  } finally {
    savingCase.value = false
  }
}

const openPublishModal = () => {
  if (caseStatus.value === 'published') {
    showError('Кейс уже опубликован')
    return
  }
  publishModal.value = true
}

const publishCase = async () => {
  publishing.value = true
  try {
    await casesStore.publishCase(caseId.value)
    caseStatus.value = 'published'
    success('Кейс успешно опубликован!')
    publishModal.value = false

    // Перенаправляем на список кейсов
    setTimeout(() => {
      router.push('/methodist/cases')
    }, 1500)
  } catch (e) {
    showError('Ошибка публикации кейса')
  } finally {
    publishing.value = false
  }
}

const openGenerateModal = () => {
  generateModal.value = true
}

const generateQuestions = async () => {
  if (questionCount.value < 1 || questionCount.value > 50) {
    showError('Количество вопросов должно быть от 1 до 50')
    return
  }

  generatingQuestions.value = true
  try {
    await casesStore.generateQuestions(caseId.value, questionCount.value)
    success(`Сгенерировано ${questionCount.value} вопросов!`)
    generateModal.value = false
    activeTab.value = 'questions'
  } catch (e) {
    showError('Ошибка генерации вопросов')
  } finally {
    generatingQuestions.value = false
  }
}

const confirmDeleteQuestion = (questionId: number) => {
  questionToDelete.value = questionId
  deleteQuestionModal.value = true
}

const deleteQuestionHandler = async () => {
  if (!questionToDelete.value) return

  deletingQuestion.value = true
  try {
    await casesStore.deleteQuestion(caseId.value, questionToDelete.value)
    success('Вопрос успешно удален')
    deleteQuestionModal.value = false
    questionToDelete.value = null
  } catch (e) {
    showError('Ошибка удаления вопроса')
  } finally {
    deletingQuestion.value = false
  }
}
</script>

<template>
  <div v-if="caseItem">
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ caseItem.title }}</h1>
          <p class="text-gray-600">Редактирование кейса</p>
        </div>
        <div class="flex items-center space-x-3">
          <span
            :class="[
              'px-3 py-1 text-sm font-medium rounded-full',
              caseStatus === 'published'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            ]"
          >
            {{ caseStatus === 'published' ? 'Опубликован' : 'Черновик' }}
          </span>
          <AppButton
            v-if="caseStatus === 'draft'"
            @click="openPublishModal"
            variant="primary"
          >
            📢 Опубликовать
          </AppButton>
        </div>
      </div>
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
        @click="activeTab = 'questions'"
        :class="[
          'px-6 py-3 font-medium rounded-lg transition-colors',
          activeTab === 'questions'
            ? 'bg-primary text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        ]"
      >
        ❓ Вопросы
        <span v-if="caseItem.questions && caseItem.questions.length > 0" class="ml-2 text-xs">
          ({{ caseItem.questions.length }})
        </span>
      </button>
      <button
        @click="activeTab = 'results'; loadResults()"
        :class="[
          'px-6 py-3 font-medium rounded-lg transition-colors',
          activeTab === 'results'
            ? 'bg-primary text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        ]"
      >
        📊 Результаты
        <span v-if="results.length > 0" class="ml-2 text-xs">
          ({{ results.length }})
        </span>
      </button>
    </div>

    <!-- Таб: Информация -->
    <AppCard v-if="activeTab === 'info'">
      <form @submit.prevent="saveCase" class="space-y-6">
        <h2 class="text-xl font-bold text-gray-900">Основная информация</h2>

        <!-- Название кейса -->
        <div>
          <AppInput
            v-model="caseTitle"
            label="Название кейса"
            placeholder="Название кейса"
            :disabled="savingCase"
          />
        </div>

        <!-- Описание кейса -->
        <div>
          <AppInput
            v-model="caseDescription"
            type="textarea"
            label="Описание кейса"
            placeholder="Описание кейса"
            :rows="3"
            :disabled="savingCase"
          />
        </div>

        <!-- Содержание кейса -->
        <div>
          <AppInput
            v-model="caseCleaningText"
            type="textarea"
            label="Содержание кейса"
            placeholder="Содержание кейса"
            :rows="12"
            :disabled="savingCase"
          />
        </div>

        <!-- Кнопки действий -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <AppButton
            @click="router.push('/methodist/cases')"
            variant="secondary"
            type="button"
            :disabled="savingCase"
          >
            Назад к списку
          </AppButton>
          <AppButton
            type="submit"
            :loading="savingCase"
            :disabled="savingCase"
          >
            <span v-if="savingCase">Сохранение...</span>
            <span v-else>Сохранить изменения</span>
          </AppButton>
        </div>
      </form>
    </AppCard>

    <!-- Таб: Вопросы -->
    <AppCard v-if="activeTab === 'questions'">
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-900">Вопросы для кейса</h2>
          <AppButton @click="openGenerateModal">
            ✨ Сгенерировать вопросы
          </AppButton>
        </div>

        <!-- Список вопросов -->
        <div v-if="caseItem.questions && caseItem.questions.length > 0" class="space-y-4">
          <div
            v-for="(question, index) in caseItem.questions"
            :key="question.id"
            class="p-4 border border-gray-200 rounded-lg bg-gray-50"
          >
            <div class="flex items-start justify-between mb-2">
              <h3 class="font-semibold text-gray-900">Вопрос {{ index + 1 }}</h3>
              <div class="flex items-center space-x-2">
                <span class="text-xs text-gray-500">ID: {{ question.id }}</span>
                <button
                  @click="confirmDeleteQuestion(question.id)"
                  :disabled="deletingQuestion"
                  class="text-red-600 hover:text-red-800 transition-colors p-1 rounded hover:bg-red-50"
                  title="Удалить вопрос"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Вопрос:</label>
                <p class="text-gray-900 bg-white p-3 rounded border border-gray-200">
                  {{ question.question }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ответ:</label>
                <p class="text-gray-700 bg-white p-3 rounded border border-gray-200">
                  {{ question.answer }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Пустое состояние -->
        <div v-else class="text-center py-12">
          <div class="text-6xl mb-4">❓</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Вопросы еще не сгенерированы</h3>
          <p class="text-gray-600 mb-6">
            Нажмите кнопку "Сгенерировать вопросы" для автоматической генерации вопросов на основе содержания кейса
          </p>
          <AppButton @click="openGenerateModal">
            ✨ Сгенерировать вопросы
          </AppButton>
        </div>
      </div>
    </AppCard>

    <!-- Таб: Результаты -->
    <AppCard v-if="activeTab === 'results'">
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-900">Результаты студентов</h2>
          <AppButton @click="loadResults" :loading="loadingResults">
            🔄 Обновить
          </AppButton>
        </div>

        <!-- Loading results -->
        <div v-if="loadingResults" class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4 mx-auto"></div>
          <p class="text-gray-600">Загрузка результатов...</p>
        </div>

        <!-- Results grouped by questions -->
        <div v-else-if="Object.keys(resultsByQuestion).length > 0" class="space-y-8">
          <div
            v-for="(group, testId) in resultsByQuestion"
            :key="testId"
            class="border border-gray-200 rounded-lg overflow-hidden"
          >
            <!-- Question header -->
            <div class="bg-gray-50 p-4 border-b border-gray-200">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="font-semibold text-gray-900 mb-2">
                    Вопрос ID: {{ testId }}
                  </h3>
                  <p v-if="group.question" class="text-gray-700">
                    {{ group.question.question }}
                  </p>
                  <p v-else class="text-gray-500 text-sm">
                    Текст вопроса не найден
                  </p>
                </div>
                <span class="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {{ group.results.length }} ответ(ов)
                </span>
              </div>

              <!-- Correct answer -->
              <div v-if="group.question?.answer" class="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <label class="block text-xs font-medium text-green-700 mb-1">Правильный ответ:</label>
                <p class="text-sm text-green-900">{{ group.question.answer }}</p>
              </div>
            </div>

            <!-- Student answers -->
            <div class="divide-y divide-gray-200">
              <div
                v-for="result in group.results"
                :key="result.id"
                class="p-4 hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <div class="flex items-center mb-1">
                      <svg class="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <h4 class="font-medium text-gray-900">
                        {{ result.student?.full_name || `Студент ID: ${result.student_id}` }}
                      </h4>
                    </div>
                    <p v-if="result.student?.email" class="text-sm text-gray-500 ml-7">
                      {{ result.student.email }}
                    </p>
                  </div>

                  <!-- Score badge -->
                  <div class="ml-4 flex flex-col items-end">
                    <!-- Режим просмотра -->
                    <div v-if="!editingScores[result.id]" class="flex items-center space-x-2">
                      <div
                        :class="[
                          'px-3 py-1 rounded-lg font-bold text-lg',
                          result.score >= 80 ? 'bg-green-100 text-green-800' :
                          result.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        ]"
                      >
                        {{ result.score }}
                      </div>
                      <button
                        @click="startEditingScore(result.id, result.score)"
                        class="p-1 text-gray-400 hover:text-primary transition-colors rounded hover:bg-gray-100"
                        title="Изменить оценку"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>

                    <!-- Режим редактирования -->
                    <div v-else class="flex flex-col items-end space-y-2">
                      <div class="flex items-center space-x-2">
                        <input
                          v-model.number="newScores[result.id]"
                          type="number"
                          min="0"
                          max="100"
                          class="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary text-center font-bold"
                          :disabled="updatingScores[result.id]"
                        />
                        <button
                          @click="updateScore(result.id)"
                          :disabled="updatingScores[result.id]"
                          class="p-1 text-green-600 hover:text-green-800 transition-colors rounded hover:bg-green-50 disabled:opacity-50"
                          title="Сохранить"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          @click="cancelEditingScore(result.id)"
                          :disabled="updatingScores[result.id]"
                          class="p-1 text-red-600 hover:text-red-800 transition-colors rounded hover:bg-red-50 disabled:opacity-50"
                          title="Отмена"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <span class="text-xs text-gray-500 mt-1">
                      {{ new Date(result.created_at).toLocaleDateString('ru-RU') }}
                    </span>
                  </div>
                </div>

                <!-- Student answer -->
                <div class="ml-7 bg-gray-50 p-3 rounded border border-gray-200">
                  <label class="block text-xs font-medium text-gray-700 mb-1">Ответ студента:</label>
                  <p class="text-sm text-gray-900 whitespace-pre-wrap">{{ result.answer }}</p>
                </div>

                <!-- File URL if exists -->
                <div v-if="result.file_url" class="ml-7 mt-2">
                  <a
                    :href="result.file_url"
                    target="_blank"
                    class="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Прикрепленный файл
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="text-center py-12">
          <div class="text-6xl mb-4">📊</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Результаты не найдены</h3>
          <p class="text-gray-600">
            Студенты еще не отвечали на вопросы этого кейса
          </p>
        </div>
      </div>
    </AppCard>

    <!-- Модальное окно подтверждения публикации -->
    <AppModal :show="publishModal" @close="publishModal = false" title="Подтверждение публикации">
      <div class="space-y-4">
        <p class="text-gray-700">
          Вы уверены, что хотите опубликовать этот кейс? После публикации кейс станет доступен
          всем студентам.
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end space-x-3">
          <AppButton @click="publishModal = false" variant="secondary" :disabled="publishing">
            Отмена
          </AppButton>
          <AppButton @click="publishCase" :loading="publishing">
            <span v-if="publishing">Публикация...</span>
            <span v-else>Опубликовать</span>
          </AppButton>
        </div>
      </template>
    </AppModal>

    <!-- Модальное окно генерации вопросов -->
    <AppModal :show="generateModal" @close="generateModal = false" title="Генерация вопросов">
      <div class="space-y-4">
        <p class="text-gray-700">
          Укажите количество вопросов, которые нужно сгенерировать на основе содержания кейса.
        </p>
        <div>
          <AppInput
            v-model.number="questionCount"
            type="number"
            label="Количество вопросов"
            placeholder="10"
            :min="1"
            :max="50"
            :disabled="generatingQuestions"
          />
          <p class="mt-2 text-sm text-gray-500">
            Рекомендуется от 5 до 15 вопросов
          </p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end space-x-3">
          <AppButton @click="generateModal = false" variant="secondary" :disabled="generatingQuestions">
            Отмена
          </AppButton>
          <AppButton @click="generateQuestions" :loading="generatingQuestions">
            <span v-if="generatingQuestions">Генерация...</span>
            <span v-else>Сгенерировать</span>
          </AppButton>
        </div>
      </template>
    </AppModal>

    <!-- Модальное окно подтверждения удаления вопроса -->
    <AppModal :show="deleteQuestionModal" @close="deleteQuestionModal = false" title="Подтверждение удаления">
      <div class="space-y-4">
        <p class="text-gray-700">
          Вы уверены, что хотите удалить этот вопрос? Это действие нельзя отменить.
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end space-x-3">
          <AppButton @click="deleteQuestionModal = false" variant="secondary" :disabled="deletingQuestion">
            Отмена
          </AppButton>
          <AppButton @click="deleteQuestionHandler" variant="danger" :loading="deletingQuestion">
            <span v-if="deletingQuestion">Удаление...</span>
            <span v-else>Удалить</span>
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>

  <!-- Loading State -->
  <div v-else class="flex flex-col items-center justify-center py-12">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
    <p class="text-gray-600">Загрузка кейса...</p>
  </div>
</template>
