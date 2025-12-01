<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCasesStore } from '@/stores/cases'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/common/AppCard.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const casesStore = useCasesStore()
const { success, error: showError } = useToast()

const title = ref('')
const description = ref('')
const selectedFile = ref<File | null>(null)
const statusValue = ref<'draft' | 'published'>('draft')
const loading = ref(false)

const isFormValid = computed(() => {
  return title.value.trim().length > 0 && selectedFile.value !== null
})

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]

    // Проверяем, что это PDF файл
    if (file.type !== 'application/pdf') {
      showError('Пожалуйста, выберите PDF файл')
      return
    }

    selectedFile.value = file
  }
}

const handleSubmit = async () => {
  if (!title.value) {
    showError('Название обязательно для заполнения')
    return
  }

  if (!selectedFile.value) {
    showError('Выберите PDF файл')
    return
  }

  loading.value = true

  try {
    const caseItem = await casesStore.createCaseFromPDF(
      selectedFile.value,
      title.value,
      description.value || undefined,
      statusValue.value
    )
    success('Кейс успешно создан!')
    await router.push(`/methodist/cases/${caseItem.id}/edit`)
  } catch (e: any) {
    const errorMessage = e.response?.data?.detail || 'Ошибка создания кейса'
    showError(errorMessage)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Создание кейса</h1>
      <p class="text-gray-600">Загрузите PDF файл и заполните информацию о кейсе</p>
    </div>

    <AppCard>
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Название кейса -->
        <div>
          <AppInput
            v-model="title"
            label="Название кейса"
            placeholder="Например: Кейс по гражданскому праву"
            :disabled="loading"
            required
          />
        </div>

        <!-- Описание кейса -->
        <div>
          <AppInput
            v-model="description"
            type="textarea"
            label="Описание кейса (опционально)"
            placeholder="Краткое описание кейса"
            :rows="3"
            :disabled="loading"
          />
        </div>

        <!-- Загрузка PDF файла -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            PDF файл с кейсом <span class="text-red-500">*</span>
          </label>
          <div class="space-y-3">
            <div class="flex items-center justify-center w-full">
              <label
                :class="[
                  'flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                  loading
                    ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                    : selectedFile
                    ? 'bg-green-50 border-green-300 hover:bg-green-100'
                    : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                ]"
              >
                <div class="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    v-if="!selectedFile"
                    class="w-10 h-10 mb-3 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <div v-if="selectedFile" class="mb-2 text-4xl">📄</div>
                  <p class="mb-2 text-sm text-gray-600">
                    <span class="font-semibold">
                      {{ selectedFile ? selectedFile.name : 'Нажмите для выбора файла' }}
                    </span>
                  </p>
                  <p class="text-xs text-gray-500">PDF (MAX. 10MB)</p>
                  <p v-if="selectedFile" class="text-xs text-green-600 mt-1">
                    Размер: {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
                  </p>
                </div>
                <input
                  type="file"
                  @change="handleFileChange"
                  :disabled="loading"
                  accept=".pdf,application/pdf"
                  class="hidden"
                />
              </label>
            </div>
            <p class="text-sm text-gray-500">
              💡 Загрузите PDF файл с содержанием кейса. Текст будет автоматически извлечен из документа.
            </p>
          </div>
        </div>

        <!-- Статус публикации -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Статус публикации
          </label>
          <div class="flex space-x-4">
            <label class="flex items-center cursor-pointer">
              <input
                type="radio"
                v-model="statusValue"
                value="draft"
                :disabled="loading"
                class="w-4 h-4 text-primary focus:ring-primary"
              />
              <span class="ml-2 text-sm text-gray-700">Черновик</span>
            </label>
            <label class="flex items-center cursor-pointer">
              <input
                type="radio"
                v-model="statusValue"
                value="published"
                :disabled="loading"
                class="w-4 h-4 text-primary focus:ring-primary"
              />
              <span class="ml-2 text-sm text-gray-700">Опубликовать сразу</span>
            </label>
          </div>
          <p class="mt-2 text-xs text-gray-500">
            Вы можете сохранить кейс как черновик и опубликовать его позже
          </p>
        </div>

        <!-- Кнопки действий -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <AppButton
            @click="router.push('/methodist/cases')"
            variant="secondary"
            type="button"
            :disabled="loading"
          >
            Отмена
          </AppButton>
          <AppButton
            type="submit"
            :loading="loading"
            :disabled="!isFormValid || loading"
          >
            <span v-if="loading">Создание...</span>
            <span v-else>Создать кейс</span>
          </AppButton>
        </div>
      </form>
    </AppCard>
  </div>
</template>
