<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCoursesStore } from '@/stores/courses'
import { useToast } from '@/composables/useToast'
import { uploadFile as uploadToSupabase } from '@/lib/supabase'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppModal from '@/components/common/AppModal.vue'

const route = useRoute()
const coursesStore = useCoursesStore()
const { success, error: showError } = useToast()

const courseId = computed(() => Number(route.params.id))
const course = computed(() => coursesStore.currentCourse)
const activeTab = ref<'info' | 'summary' | 'test'>('info')
const publishModal = ref(false)

const summaryContent = ref('')
const testQuestions = ref<any[]>([])

// Поля для редактирования курса
const courseTitle = ref('')
const courseDescription = ref('')
const courseOriginalText = ref('')
const courseFileUrl = ref('')
const courseStatus = ref<'draft' | 'published'>('draft')
const editingCourse = ref(false)

// Поля для работы с файлами
const inputType = ref<'text' | 'file'>('text')
const selectedFile = ref<File | null>(null)
const uploading = ref(false)

const generatingSummary = ref(false)
const generatingTest = ref(false)
const publishing = ref(false)
const loadingSummary = ref(false)
const loadingTest = ref(false)
const savingCourse = ref(false)
const savingSummary = ref(false)
const savingTest = ref(false)

onMounted(async () => {
  try {
    await coursesStore.fetchCourse(courseId.value)
    if (course.value) {
      // Загружаем данные курса для редактирования
      courseTitle.value = course.value.title
      courseDescription.value = course.value.description
      courseOriginalText.value = course.value.original_text
      courseFileUrl.value = course.value.file_url || ''
      courseStatus.value = course.value.status

      // Определяем тип ввода на основе того, что заполнено
      if (course.value.file_url) {
        inputType.value = 'file'
      } else {
        inputType.value = 'text'
      }
    }
    if (course.value?.summary) {
      summaryContent.value = course.value.summary.content
    }
    if (course.value?.test) {
      testQuestions.value = course.value.test.questions
    }
  } catch (e) {
    showError('Ошибка загрузки курса')
  }
})

const loadSummary = async () => {
  loadingSummary.value = true
  try {
    const summary = await coursesStore.fetchSummary(courseId.value)
    summaryContent.value = summary.content
  } catch (e: any) {
    // Если конспект не найден, это нормально - он еще не сгенерирован
    if (e.response?.status !== 404) {
      showError('Ошибка загрузки конспекта')
    }
  } finally {
    loadingSummary.value = false
  }
}

const loadTest = async () => {
  loadingTest.value = true
  try {
    const test = await coursesStore.fetchTest(courseId.value)
    testQuestions.value = test.questions
  } catch (e: any) {
    // Если тест не найден, это нормально - он еще не сгенерирован
    if (e.response?.status !== 404) {
      showError('Ошибка загрузки теста')
    }
  } finally {
    loadingTest.value = false
  }
}

const generateSummary = async () => {
  generatingSummary.value = true
  try {
    const summary = await coursesStore.generateSummary(courseId.value)
    summaryContent.value = summary.content
    success('Конспект сгенерирован!')
    activeTab.value = 'summary'
  } catch (e) {
    showError('Ошибка генерации конспекта')
  } finally {
    generatingSummary.value = false
  }
}

const saveSummary = async () => {
  if (!course.value?.summary?.id) {
    showError('Не удалось найти ID конспекта')
    return
  }

  savingSummary.value = true
  try {
    await coursesStore.updateSummary(course.value.summary.id, summaryContent.value)
    success('Конспект сохранен!')
  } catch (e) {
    showError('Ошибка сохранения конспекта')
  } finally {
    savingSummary.value = false
  }
}

const generateTest = async () => {
  generatingTest.value = true
  try {
    const test = await coursesStore.generateTest(courseId.value)
    testQuestions.value = test.questions
    success('Тест сгенерирован!')
    activeTab.value = 'test'
  } catch (e) {
    showError('Ошибка генерации теста')
  } finally {
    generatingTest.value = false
  }
}

const saveTest = async () => {
  if (!course.value?.test?.id) {
    showError('Не удалось найти ID теста')
    return
  }

  savingTest.value = true
  try {
    await coursesStore.updateTest(course.value.test.id, testQuestions.value)
    success('Тест сохранен!')
  } catch (e) {
    showError('Ошибка сохранения теста')
  } finally {
    savingTest.value = false
  }
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
  }
}

const uploadFile = async (): Promise<string> => {
  if (!selectedFile.value) {
    throw new Error('Файл не выбран')
  }

  uploading.value = true
  try {
    const fileUrl = await uploadToSupabase(selectedFile.value, 'course-materials')
    return fileUrl
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  } finally {
    uploading.value = false
  }
}

const saveCourseInfo = async () => {
  savingCourse.value = true
  try {
    let uploadedFileUrl = courseFileUrl.value

    // Если выбран новый файл, загружаем его
    if (inputType.value === 'file' && selectedFile.value) {
      uploadedFileUrl = await uploadFile()
    }

    await coursesStore.updateCourse(courseId.value, {
      title: courseTitle.value,
      description: courseDescription.value,
      original_text: inputType.value === 'text' ? courseOriginalText.value : undefined,
      file_url: inputType.value === 'file' ? uploadedFileUrl : undefined,
      status: courseStatus.value
    })
    success('Информация о курсе сохранена!')
    editingCourse.value = false
    selectedFile.value = null
  } catch (e) {
    showError('Ошибка сохранения курса')
  } finally {
    savingCourse.value = false
  }
}

const cancelEditCourse = () => {
  if (course.value) {
    courseTitle.value = course.value.title
    courseDescription.value = course.value.description
    courseOriginalText.value = course.value.original_text
    courseFileUrl.value = course.value.file_url || ''
    courseStatus.value = course.value.status

    // Сбрасываем тип ввода
    if (course.value.file_url) {
      inputType.value = 'file'
    } else {
      inputType.value = 'text'
    }
  }
  selectedFile.value = null
  editingCourse.value = false
}

const publishCourse = async () => {
  publishing.value = true
  try {
    await coursesStore.publishCourse(courseId.value)
    success('Курс опубликован!')
    publishModal.value = false
  } catch (e) {
    showError('Ошибка публикации курса')
  } finally {
    publishing.value = false
  }
}
</script>

<template>
  <div v-if="course">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ course.title }}</h1>
        <p class="text-gray-600">{{ course.description }}</p>
      </div>
      <div class="flex items-center space-x-3">
        <span
          :class="[
            'px-3 py-1 text-sm font-medium rounded-full',
            course.status === 'published'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          ]"
        >
          {{ course.status === 'published' ? 'Опубликован' : 'Черновик' }}
        </span>
        <AppButton
          v-if="course.status === 'draft'"
          @click="publishModal = true"
          variant="success"
          :disabled="savingCourse || generatingSummary || generatingTest || savingSummary || savingTest"
        >
          📢 Опубликовать
        </AppButton>
      </div>
    </div>

    <div class="flex space-x-4 mb-6">
      <button
        v-for="tab in [
          { key: 'info', label: 'Информация' },
          // { key: 'summary', label: 'Конспект' },
          { key: 'test', label: 'Тест' }
        ]"
        :key="tab.key"
        @click="() => {
          activeTab = tab.key as any
          if (tab.key === 'summary' && !summaryContent) {
            loadSummary()
          }
          if (tab.key === 'test' && testQuestions.length === 0) {
            loadTest()
          }
        }"
        :class="[
          'px-6 py-3 font-medium rounded-lg transition-colors',
          activeTab === tab.key
            ? 'bg-primary text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Info Tab -->
    <AppCard v-if="activeTab === 'info'">
      <div class="space-y-6">
        <!-- Заголовок с кнопкой редактирования -->
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Информация о курсе</h3>
          <AppButton
            v-if="!editingCourse"
            @click="editingCourse = true"
            variant="secondary"
            size="sm"
            :disabled="savingCourse || generatingSummary || generatingTest || savingSummary || savingTest"
          >
            ✏️ Редактировать
          </AppButton>
        </div>

        <!-- Режим просмотра -->
        <div v-if="!editingCourse" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Название</label>
            <p class="text-gray-900 font-semibold">{{ course.title }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <p class="text-gray-700">{{ course.description }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Статус</label>
            <span
              :class="[
                'inline-flex px-3 py-1 text-sm font-medium rounded-full',
                course.status === 'published'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              ]"
            >
              {{ course.status === 'published' ? 'Опубликован' : 'Черновик' }}
            </span>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Материал курса</label>
            <div v-if="course.original_text" class="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <p class="whitespace-pre-wrap text-gray-700">{{ course.original_text }}</p>
            </div>
            <div v-else-if="course.file_url" class="bg-gray-50 p-4 rounded-lg">
              <a
                :href="course.file_url"
                target="_blank"
                class="flex items-center space-x-2 text-primary hover:text-blue-700 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>📄 Открыть файл</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Режим редактирования -->
        <div v-else class="space-y-4">
          <AppInput
            v-model="courseTitle"
            label="Название курса"
            placeholder="Введите название курса"
            :disabled="savingCourse"
          />

          <AppInput
            v-model="courseDescription"
            type="textarea"
            label="Описание курса"
            placeholder="Введите описание курса"
            :rows="3"
            :disabled="savingCourse"
          />

          <!-- Выбор статуса -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">Статус курса</label>
            <div class="flex space-x-4">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  v-model="courseStatus"
                  value="draft"
                  :disabled="savingCourse"
                  class="w-4 h-4 text-primary focus:ring-primary"
                />
                <span class="text-sm text-gray-700">Черновик</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  v-model="courseStatus"
                  value="published"
                  :disabled="savingCourse"
                  class="w-4 h-4 text-primary focus:ring-primary"
                />
                <span class="text-sm text-gray-700">Опубликован</span>
              </label>
            </div>
          </div>

          <!-- Текстовый материал (если курс создан с текстом) -->
          <div v-if="inputType === 'text'">
            <AppInput
              v-model="courseOriginalText"
              type="textarea"
              label="Материал курса"
              placeholder="Введите или вставьте текстовый материал курса..."
              :rows="12"
              :disabled="savingCourse || uploading"
            />
            <p class="mt-2 text-sm text-gray-500">
              💡 Курс был создан с текстовым материалом
            </p>
          </div>

          <!-- Загрузка файла (если курс создан с файлом) -->
          <div v-else>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Файл с материалом
            </label>
            <div class="space-y-3">
              <div class="flex items-center space-x-3">
                <input
                  type="file"
                  @change="handleFileChange"
                  :disabled="savingCourse || uploading"
                  accept=".pdf,.doc,.docx,.txt"
                  class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary p-2"
                />
              </div>
              <div v-if="selectedFile" class="text-sm text-gray-600">
                📄 Выбран новый файл: {{ selectedFile.name }} ({{ (selectedFile.size / 1024).toFixed(2) }} KB)
              </div>
              <div v-else-if="courseFileUrl" class="text-sm text-gray-600">
                📄 Текущий файл: <a :href="courseFileUrl" target="_blank" class="text-primary hover:underline">Открыть</a>
              </div>
              <p class="text-sm text-gray-500">
                💡 Курс был создан с файлом. Вы можете загрузить новый файл для замены
              </p>
            </div>
          </div>

          <!-- Кнопки сохранения/отмены -->
          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <AppButton
              @click="cancelEditCourse"
              variant="secondary"
              :disabled="savingCourse || uploading"
            >
              Отмена
            </AppButton>
            <AppButton
              @click="saveCourseInfo"
              :loading="savingCourse || uploading"
              :disabled="savingCourse || uploading || !courseTitle || !courseDescription || (inputType === 'text' ? !courseOriginalText : (!selectedFile && !courseFileUrl))"
            >
              <span v-if="uploading">Загрузка файла...</span>
              <span v-else-if="savingCourse">Сохранение...</span>
              <span v-else>💾 Сохранить изменения</span>
            </AppButton>
          </div>
        </div>

        <!-- Разделитель -->
        <div class="border-t border-gray-200 pt-6">
          <h3 class="text-lg font-semibold mb-4">Генерация контента</h3>
          <div class="flex flex-wrap gap-3">
<!--            <AppButton-->
<!--              @click="generateSummary"-->
<!--              :loading="generatingSummary"-->
<!--              :disabled="generatingSummary || generatingTest || editingCourse || savingCourse"-->
<!--            >-->
<!--              {{ generatingSummary ? 'Генерация...' : '🤖 Сгенерировать конспект' }}-->
<!--            </AppButton>-->

            <AppButton
              @click="generateTest"
              :loading="generatingTest"
              :disabled="generatingTest || generatingSummary || editingCourse || savingCourse"
              variant="secondary"
            >
              {{ generatingTest ? 'Генерация...' : '🤖 Сгенерировать тест' }}
            </AppButton>

            <!-- Fake-door buttons -->
            <button
              disabled
              class="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg opacity-50 cursor-not-allowed"
              title="Функция в разработке"
            >
              🔒 Автоматическая анонимизация
            </button>

            <button
              disabled
              class="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg opacity-50 cursor-not-allowed"
              title="Функция в разработке"
            >
              🔒 OCR распознавание
            </button>
          </div>
        </div>
      </div>
    </AppCard>

    <!-- Summary Tab -->
    <AppCard v-if="activeTab === 'summary'">
      <!-- Состояние загрузки -->
      <div v-if="loadingSummary" class="flex flex-col items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p class="text-gray-600">Загрузка конспекта...</p>
      </div>

      <!-- Конспект не найден -->
      <div v-else-if="!summaryContent && !loadingSummary" class="text-center py-12">
        <div class="mb-4">
          <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Конспект не найден</h3>
        <p class="text-gray-600 mb-6">
          Конспект еще не был сгенерирован для этого курса.<br>
          Перейдите на вкладку "Информация" и нажмите "Сгенерировать конспект".
        </p>
        <AppButton @click="activeTab = 'info'">
          Перейти к генерации
        </AppButton>
      </div>

      <!-- Редактор конспекта -->
      <div v-else class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Редактор конспекта</h3>
          <AppButton
            @click="generateSummary"
            :loading="generatingSummary"
            :disabled="generatingSummary"
            variant="secondary"
            size="sm"
          >
            {{ generatingSummary ? 'Генерация...' : '🔄 Сгенерировать заново' }}
          </AppButton>
        </div>

        <AppInput
          v-model="summaryContent"
          type="textarea"
          :rows="20"
          placeholder="Конспект курса..."
          :disabled="loadingSummary"
        />

        <div class="flex justify-between items-center pt-4 border-t border-gray-200">
          <p class="text-sm text-gray-500">
            💡 Вы можете отредактировать конспект перед сохранением
          </p>
          <AppButton
            @click="saveSummary"
            :loading="savingSummary"
            :disabled="!summaryContent || loadingSummary || savingSummary"
          >
            {{ savingSummary ? 'Сохранение...' : '💾 Сохранить конспект' }}
          </AppButton>
        </div>
      </div>
    </AppCard>

    <!-- Test Tab -->
    <AppCard v-if="activeTab === 'test'">
      <!-- Состояние загрузки -->
      <div v-if="loadingTest" class="flex flex-col items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p class="text-gray-600">Загрузка теста...</p>
      </div>

      <!-- Тест не найден -->
      <div v-else-if="testQuestions.length === 0 && !loadingTest" class="text-center py-12">
        <div class="mb-4">
          <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Тест не найден</h3>
        <p class="text-gray-600 mb-6">
          Тест еще не был сгенерирован для этого курса.<br>
          Перейдите на вкладку "Информация" и нажмите "Сгенерировать тест".
        </p>
        <AppButton @click="activeTab = 'info'">
          Перейти к генерации
        </AppButton>
      </div>

      <!-- Редактор теста -->
      <div v-else class="space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Редактор теста</h3>
          <div class="flex items-center space-x-3">
            <span class="text-sm text-gray-600">
              Всего вопросов: <span class="font-semibold text-gray-900">{{ testQuestions.length }}</span>
            </span>
            <AppButton
              @click="generateTest"
              :loading="generatingTest"
              :disabled="generatingTest"
              variant="secondary"
              size="sm"
            >
              {{ generatingTest ? 'Генерация...' : '🔄 Сгенерировать заново' }}
            </AppButton>
          </div>
        </div>

        <!-- Список вопросов -->
        <div class="space-y-4">
          <div
            v-for="(question, index) in testQuestions"
            :key="index"
            class="border border-gray-200 rounded-lg p-5 bg-gray-50 hover:border-primary transition-colors"
          >
            <div class="space-y-4">
              <!-- Вопрос -->
              <div>
                <AppInput
                  type="textarea"
                  v-model="question.question"
                  :label="`Вопрос ${index + 1}`"
                  placeholder="Текст вопроса..."
                  :rows="2"
                  :disabled="loadingTest"
                  :auto-resize="true"
                />
              </div>

              <!-- Варианты ответов -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Варианты ответов
                </label>
                <div class="space-y-2">
                  <div
                    v-for="(option, optIndex) in question.options"
                    :key="optIndex"
                    class="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-200"
                  >
                    <!-- Radio для правильного ответа -->
                    <input
                      type="radio"
                      :name="`correct-${index}`"
                      :value="option"
                      v-model="question.correct_answer"
                      class="w-5 h-5 text-primary focus:ring-primary"
                      :disabled="loadingTest"
                    />

                    <!-- Текст варианта -->
                    <input
                      v-model="question.options[optIndex]"
                      class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      :placeholder="`Вариант ${optIndex + 1}`"
                      :disabled="loadingTest"
                    />

                    <!-- Индикатор правильного ответа -->
                    <span
                      v-if="question.correct_answer === option"
                      class="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded"
                    >
                      ✓ Правильный
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Кнопка сохранения -->
        <div class="flex justify-between items-center pt-4 border-t border-gray-200">
          <p class="text-sm text-gray-500">
            💡 Отметьте правильный ответ для каждого вопроса
          </p>
          <AppButton
            @click="saveTest"
            :loading="savingTest"
            :disabled="testQuestions.length === 0 || loadingTest || savingTest"
          >
            {{ savingTest ? 'Сохранение...' : '💾 Сохранить тест' }}
          </AppButton>
        </div>
      </div>
    </AppCard>

    <AppModal :show="publishModal" @close="publishModal = false" title="Публикация курса">
      <p class="text-gray-700">
        Вы уверены, что хотите опубликовать этот курс? После публикации он станет доступен студентам.
      </p>
      <template #footer>
        <div class="flex justify-end space-x-3">
          <AppButton
            @click="publishModal = false"
            variant="secondary"
            :disabled="publishing"
          >
            Отмена
          </AppButton>
          <AppButton
            @click="publishCourse"
            :loading="publishing"
            :disabled="publishing"
            variant="success"
          >
            {{ publishing ? 'Публикация...' : 'Опубликовать' }}
          </AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
