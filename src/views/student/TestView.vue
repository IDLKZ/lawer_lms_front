<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
const test = computed(() => testsStore.currentTest)
const answers = ref<Record<number, string>>({})
const submitting = ref(false)

onMounted(async () => {
  try {
    await testsStore.fetchTest(testId.value)
  } catch (e) {
    showError('Ошибка загрузки теста')
  }
})

const allAnswered = computed(() => {
  if (!test.value) return false
  return test.value.questions.every(q => answers.value[q.id])
})

const submitTest = async () => {
  if (!test.value || !allAnswered.value) return

  submitting.value = true

  try {
    const submission = {
      answers: test.value.questions.map(q => ({
        question_id: q.id,
        selected_answer: answers.value[q.id] || ''
      }))
    }

    await testsStore.submitTest(testId.value, submission)
    // Переходим на страницу результатов с данными
    await router.push({
      name: 'student-test-result',
      params: {id: test.value.course_id}
    })
  } catch (e) {
    showError('Ошибка отправки теста')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div v-if="test">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Тестирование</h1>
      <p class="text-gray-600">Ответьте на все вопросы и отправьте тест</p>
    </div>

    <div class="space-y-6">
      <AppCard v-for="(question, index) in test.questions" :key="question.id">
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-900">
            Вопрос {{ index + 1 }} из {{ test.questions.length }}
          </h3>
          <p class="text-gray-700">{{ question.question }}</p>

          <div class="space-y-2">
            <label
              v-for="(option, optIndex) in question.options"
              :key="optIndex"
              class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              :class="answers[question.id] === option ? 'border-primary bg-blue-50' : ''"
            >
              <input
                type="radio"
                :name="`question-${question.id}`"
                :value="option"
                v-model="answers[question.id]"
                class="w-4 h-4 text-primary focus:ring-primary"
              />
              <span class="flex-1 text-gray-700">{{ option }}</span>
            </label>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">
              Отвечено вопросов: {{ Object.keys(answers).length }} / {{ test.questions.length }}
            </p>
            <p v-if="!allAnswered" class="text-sm text-danger mt-1">
              Пожалуйста, ответьте на все вопросы
            </p>
          </div>

          <AppButton
            @click="submitTest"
            :loading="submitting"
            :disabled="!allAnswered || submitting"
            size="lg"
          >
            Отправить ответы
          </AppButton>
        </div>
      </AppCard>
    </div>
  </div>
</template>
