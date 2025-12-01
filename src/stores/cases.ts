import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Case, CreateCaseRequest, CaseQuestion, CaseQuestionForStudent, SubmitCaseAnswerRequest, CaseAnswerResult } from '@/types/case'
import type { User } from '@/types/auth'
import { useApi } from '@/composables/useApi'

export const useCasesStore = defineStore('cases', () => {
  const api = useApi()
  const cases = ref<Case[]>([])
  const currentCase = ref<Case | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCases(skip: number = 0, limit: number = 100) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<Case[]>('/cases', { params: { skip, limit } })
      cases.value = response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchCase(id: number) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<Case>(`/cases/${id}`)
      currentCase.value = response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createCase(data: CreateCaseRequest) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post<Case>('/cases', data)
      cases.value.push(response.data)
      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createCaseFromPDF(file: File, title: string, description?: string, status_value?: 'draft' | 'published') {
    loading.value = true
    error.value = null
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      if (description) {
        formData.append('description', description)
      }
      if (status_value) {
        formData.append('status_value', status_value)
      }

      const response = await api.post<Case>('/cases/from-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      cases.value.push(response.data)
      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateCase(id: number, data: Partial<Case>) {
    loading.value = true
    error.value = null
    try {
      const response = await api.patch<Case>(`/cases/${id}`, data)
      const index = cases.value.findIndex(c => c.id === id)
      if (index !== -1) {
        cases.value[index] = response.data
      }
      if (currentCase.value?.id === id) {
        currentCase.value = response.data
      }
      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteCase(id: number) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/cases/${id}`)
      cases.value = cases.value.filter(c => c.id !== id)
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function publishCase(id: number) {
    return updateCase(id, { status: 'published' })
  }

  async function generateQuestions(caseId: number, count: number = 10) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post<CaseQuestion[]>(`/cases/${caseId}/generate-questions`, null, {
        params: { count }
      })

      // Обновляем вопросы в currentCase если это тот же кейс
      if (currentCase.value?.id === caseId) {
        currentCase.value.questions = response.data
      }

      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchQuestions(caseId: number) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<CaseQuestion[]>(`/cases/${caseId}/questions`)

      // Обновляем вопросы в currentCase если это тот же кейс
      if (currentCase.value?.id === caseId) {
        currentCase.value.questions = response.data
      }

      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteQuestion(caseId: number, questionId: number) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/cases/${caseId}/questions/${questionId}`)

      // Удаляем вопрос из currentCase если это тот же кейс
      if (currentCase.value?.id === caseId && currentCase.value.questions) {
        currentCase.value.questions = currentCase.value.questions.filter(q => q.id !== questionId)
      }
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchQuestionsForStudent(caseId: number) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<CaseQuestionForStudent[]>(`/cases/${caseId}/questions`)
      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function submitCaseAnswer(data: SubmitCaseAnswerRequest) {
    loading.value = true
    error.value = null
    try {
      console.log('Submitting case answer:', data)
      const response = await api.post<CaseAnswerResult>('/case-results/submit', data)
      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchTestResult(testId: number) {
    try {
      const response = await api.get<CaseAnswerResult>(`/case-results/my-result/test/${testId}`)
      return response.data
    } catch (e: any) {
      // Если результат не найден (404), возвращаем null
      if (e.response?.status === 404) {
        return null
      }
      throw e
    }
  }

  async function fetchCaseResults(caseId: number) {
    try {
      const response = await api.get<CaseAnswerResult[]>(`/case-results/case/${caseId}`)
      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  async function fetchUser(userId: number) {
    try {
      const response = await api.get<User>(`/users/${userId}`)
      return response.data
    } catch (e: any) {
      // Если пользователь не найден, возвращаем null
      if (e.response?.status === 404) {
        return null
      }
      throw e
    }
  }

  async function updateTestScore(resultId: number, score: number) {
    try {
      const response = await api.patch<CaseAnswerResult>(`/case-results/${resultId}/score`, { score })
      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    }
  }

  return {
    cases,
    currentCase,
    loading,
    error,
    fetchCases,
    fetchCase,
    createCase,
    createCaseFromPDF,
    updateCase,
    deleteCase,
    publishCase,
    generateQuestions,
    fetchQuestions,
    deleteQuestion,
    fetchQuestionsForStudent,
    submitCaseAnswer,
    fetchTestResult,
    fetchCaseResults,
    fetchUser,
    updateTestScore
  }
})
