<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCasesStore } from '@/stores/cases'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'

const router = useRouter()
const casesStore = useCasesStore()
const { success, error: showError } = useToast()

const filter = ref<'all' | 'draft' | 'published'>('all')
const deleteModal = ref(false)
const caseToDelete = ref<number | null>(null)

const filteredCases = computed(() => {
  if (filter.value === 'all') return casesStore.cases
  return casesStore.cases.filter(c => c.status === filter.value)
})

onMounted(async () => {
  try {
    await casesStore.fetchCases()
  } catch (e) {
    showError('Ошибка загрузки кейсов')
  }
})

const confirmDelete = (id: number) => {
  caseToDelete.value = id
  deleteModal.value = true
}

const deleteCase = async () => {
  if (!caseToDelete.value) return

  try {
    await casesStore.deleteCase(caseToDelete.value)
    success('Кейс удален')
    deleteModal.value = false
    caseToDelete.value = null
  } catch (e) {
    showError('Ошибка удаления кейса')
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('ru-RU')
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Кейсы</h1>
      <AppButton @click="router.push('/methodist/cases/create')">
        ➕ Создать кейс
      </AppButton>
    </div>

    <AppCard class="mb-6">
      <div class="flex items-center space-x-4">
        <span class="text-sm font-medium text-gray-700">Фильтр:</span>
        <button
          v-for="option in [
            { value: 'all', label: 'Все' },
            { value: 'draft', label: 'Черновики' },
            { value: 'published', label: 'Опубликованные' }
          ]"
          :key="option.value"
          @click="filter = option.value as any"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            filter === option.value
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          ]"
        >
          {{ option.label }}
        </button>
      </div>
    </AppCard>

    <AppCard :padding="false">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата создания</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="caseItem in filteredCases" :key="caseItem.id" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <p class="font-medium text-gray-900">{{ caseItem.title }}</p>
                <p class="text-sm text-gray-500">{{ caseItem.description }}</p>
              </td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    caseItem.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  ]"
                >
                  {{ caseItem.status === 'published' ? 'Опубликован' : 'Черновик' }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {{ formatDate(caseItem.created_at) }}
              </td>
              <td class="px-6 py-4 text-right space-x-2">
                <AppButton
                  @click="router.push(`/methodist/cases/${caseItem.id}/edit`)"
                  size="sm"
                  variant="secondary"
                >
                  Редактировать
                </AppButton>
                <AppButton
                  @click="confirmDelete(caseItem.id)"
                  size="sm"
                  variant="danger"
                >
                  Удалить
                </AppButton>
              </td>
            </tr>
            <tr v-if="filteredCases.length === 0">
              <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                Нет кейсов
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <AppModal :show="deleteModal" @close="deleteModal = false" title="Подтверждение удаления">
      <p class="text-gray-700">Вы уверены, что хотите удалить этот кейс?</p>
      <template #footer>
        <div class="flex justify-end space-x-3">
          <AppButton @click="deleteModal = false" variant="secondary">Отмена</AppButton>
          <AppButton @click="deleteCase" variant="danger">Удалить</AppButton>
        </div>
      </template>
    </AppModal>
  </div>
</template>
