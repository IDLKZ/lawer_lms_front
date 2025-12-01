<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCasesStore } from '@/stores/cases'
import { useToast } from '@/composables/useToast'
import AppCard from '@/components/common/AppCard.vue'
import AppButton from '@/components/common/AppButton.vue'

const router = useRouter()
const casesStore = useCasesStore()
const { error: showError } = useToast()

const searchQuery = ref('')

const publishedCases = computed(() => {
  const cases = casesStore.cases.filter(c => c.status === 'published')

  if (!searchQuery.value) return cases

  return cases.filter(c =>
    c.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

onMounted(async () => {
  try {
    await casesStore.fetchCases()
  } catch (e) {
    showError('Ошибка загрузки кейсов')
  }
})
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Все кейсы</h1>

    <AppCard class="mb-6">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск кейсов..."
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </AppCard>

    <div v-if="publishedCases.length === 0" class="text-center py-12">
      <AppCard>
        <p class="text-gray-500">
          {{ searchQuery ? 'Кейсы не найдены' : 'Пока нет доступных кейсов' }}
        </p>
      </AppCard>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AppCard v-for="caseItem in publishedCases" :key="caseItem.id">
        <div class="space-y-4">
          <div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ caseItem.title }}</h3>
            <p class="text-gray-600">{{ caseItem.description }}</p>
          </div>

          <AppButton @click="router.push(`/student/cases/${caseItem.id}`)" class="w-full">
            Открыть кейс
          </AppButton>
        </div>
      </AppCard>
    </div>
  </div>
</template>
