import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Test, TestSubmission, TestResult, TestSubmitResponse } from '@/types/test'
import { useApi } from '@/composables/useApi'

export const useTestsStore = defineStore('tests', () => {
  const api = useApi()
  const currentTest = ref<Test | null>(null)
  const testResults = ref<TestResult[]>([])
  const currentResult = ref<TestResult | null>(null)
  const submitResponse = ref<TestSubmitResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTest(testId: number) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<Test>(`/tests/${testId}`)
      currentTest.value = response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function submitTest(testId: number, submission: TestSubmission) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post<TestSubmitResponse>(`/tests/${testId}/submit`, submission)
      submitResponse.value = response.data
      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchResults(params?: { skip?: number; limit?: number; course_id?: number }) {
    loading.value = true
    error.value = null
    try {
      const queryParams = new URLSearchParams()
      if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString())
      if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString())
      if (params?.course_id !== undefined) queryParams.append('course_id', params.course_id.toString())

      const url = queryParams.toString() ? `/results?${queryParams.toString()}` : '/results'
      const response = await api.get<TestResult[]>(url)
      testResults.value = response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchResult(resultId: number) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<TestResult>(`/results/${resultId}`)
      currentResult.value = response.data
        console.log(currentResult.value)
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchMyResultsByCourse(courseId: number) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<TestResult[]>(`/results/my/course/${courseId}`)
      if (response.data.length > 0) {
          //@ts-ignore
        currentResult.value = response.data[0] // Берем последний результат
      }
      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    currentTest,
    testResults,
    currentResult,
    submitResponse,
    loading,
    error,
    fetchTest,
    submitTest,
    fetchResults,
    fetchResult,
    fetchMyResultsByCourse
  }
})
