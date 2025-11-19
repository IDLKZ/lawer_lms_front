<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCoursesStore } from '@/stores/courses'
import { useToast } from '@/composables/useToast'
import { uploadFile as uploadToSupabase } from '@/lib/supabase'
import AppCard from '@/components/common/AppCard.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const coursesStore = useCoursesStore()
const { success, error: showError } = useToast()

const title = ref('')
const description = ref('')
const originalText = ref('')
const fileUrl = ref('')
const selectedFile = ref<File | null>(null)
const inputType = ref<'text' | 'file'>('text')
const loading = ref(false)
const uploading = ref(false)

const isFormValid = computed(() => {
  const hasBasicInfo = title.value.trim().length > 0 && description.value.trim().length > 0
  const hasContent = inputType.value === 'text'
    ? originalText.value.trim().length > 0
    : (selectedFile.value !== null || fileUrl.value.trim().length > 0)
  return hasBasicInfo && hasContent
})

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
    // Загружаем файл в Supabase Storage
    const fileUrl = await uploadToSupabase(selectedFile.value, 'course-materials')
    return fileUrl
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  } finally {
    uploading.value = false
  }
}

const handleSubmit = async () => {
  if (!title.value || !description.value) {
    showError('Название и описание обязательны для заполнения')
    return
  }

  if (inputType.value === 'text' && !originalText.value) {
    showError('Введите текстовый материал курса')
    return
  }

  if (inputType.value === 'file' && !selectedFile.value && !fileUrl.value) {
    showError('Выберите файл или введите URL')
    return
  }

  loading.value = true

  try {
    let uploadedFileUrl = fileUrl.value

    // Если выбран файл, загружаем его
    if (inputType.value === 'file' && selectedFile.value) {
      uploadedFileUrl = await uploadFile()
    }

    const course = await coursesStore.createCourse({
      title: title.value,
      description: description.value,
      original_text: inputType.value === 'text' ? originalText.value : undefined,
      file_url: inputType.value === 'file' ? uploadedFileUrl : undefined
    })
    success('Курс успешно создан!')
    await router.push(`/methodist/courses/${course.id}/edit`)
  } catch (e: any) {
    const errorMessage = e.response?.data?.detail || 'Ошибка создания курса'
    showError(errorMessage)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Создание курса</h1>
      <p class="text-gray-600">Заполните информацию о курсе и текстовый материал</p>
    </div>

    <AppCard>
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Название курса -->
        <div>
          <AppInput
            v-model="title"
            label="Название курса"
            placeholder="Например: Основы уголовного права"
            :disabled="loading"
          />
        </div>

        <!-- Описание курса -->
        <div>
          <AppInput
            v-model="description"
            type="textarea"
            label="Описание курса"
            placeholder="Краткое описание курса и его основные темы"
            :rows="3"
            :disabled="loading"
          />
        </div>

        <!-- Выбор типа ввода -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Способ добавления материала
          </label>
          <div class="flex space-x-4">
            <label class="flex items-center cursor-pointer">
              <input
                type="radio"
                v-model="inputType"
                value="text"
                :disabled="loading"
                class="w-4 h-4 text-primary focus:ring-primary"
              />
              <span class="ml-2 text-sm text-gray-700">Ввести текст</span>
            </label>
            <label class="flex items-center cursor-pointer">
              <input
                type="radio"
                v-model="inputType"
                value="file"
                :disabled="loading"
                class="w-4 h-4 text-primary focus:ring-primary"
              />
              <span class="ml-2 text-sm text-gray-700">Загрузить файл</span>
            </label>
          </div>
        </div>

        <!-- Текстовый материал -->
        <div v-if="inputType === 'text'">
          <AppInput
            v-model="originalText"
            type="textarea"
            label="Материал курса"
            placeholder="Введите или вставьте текстовый материал курса..."
            :rows="12"
            :disabled="loading"
          />
          <p class="mt-2 text-sm text-gray-500">
            💡 Введите текстовый материал, на основе которого будут созданы краткое содержание и тест
          </p>
        </div>

        <!-- Загрузка файла -->
        <div v-else>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Файл с материалом
          </label>
          <div class="space-y-3">
            <div class="flex items-center space-x-3">
              <input
                type="file"
                @change="handleFileChange"
                :disabled="loading || uploading"
                accept=".pdf,.doc,.docx,.txt"
                class="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary p-2"
              />
            </div>
            <div v-if="selectedFile" class="text-sm text-gray-600">
              📄 Выбран файл: {{ selectedFile.name }} ({{ (selectedFile.size / 1024).toFixed(2) }} KB)
            </div>
            <p class="text-sm text-gray-500">
              💡 Загрузите файл с материалом курса (.pdf, .doc, .docx, .txt)
            </p>
          </div>
        </div>

        <!-- Кнопки действий -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <AppButton
            @click="router.push('/methodist/courses')"
            variant="secondary"
            type="button"
            :disabled="loading"
          >
            Отмена
          </AppButton>
          <AppButton
            type="submit"
            :loading="loading || uploading"
            :disabled="!isFormValid || loading || uploading"
          >
            <span v-if="uploading">Загрузка файла...</span>
            <span v-else-if="loading">Создание...</span>
            <span v-else>Создать курс</span>
          </AppButton>
        </div>
      </form>
    </AppCard>
  </div>
</template>
