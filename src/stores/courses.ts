import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Course, CreateCourseRequest } from '@/types/course'
import type { Summary, Test } from '@/types/test'
import { useApi } from '@/composables/useApi'

export const useCoursesStore = defineStore('courses', () => {
  const api = useApi()
  const courses = ref<Course[]>([])
  const currentCourse = ref<Course | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCourses() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<Course[]>('/courses')
      courses.value = response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchCourse(id: number) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<Course>(`/courses/${id}`)
      currentCourse.value = response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createCourse(data: CreateCourseRequest) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post<Course>('/courses', data)
      courses.value.push(response.data)
      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateCourse(id: number, data: Partial<Course>) {
    loading.value = true
    error.value = null
    try {
      const response = await api.patch<Course>(`/courses/${id}`, data)
      const index = courses.value.findIndex(c => c.id === id)
      if (index !== -1) {
        courses.value[index] = response.data
      }
      if (currentCourse.value?.id === id) {
        currentCourse.value = response.data
      }
      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteCourse(id: number) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/courses/${id}`)
      courses.value = courses.value.filter(c => c.id !== id)
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function publishCourse(id: number) {
    return updateCourse(id, { status: 'published' })
  }

  async function fetchSummary(courseId: number) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<Summary>(`/summaries/course/${courseId}`)
      if (currentCourse.value?.id === courseId) {
        currentCourse.value.summary = response.data
      }
      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function generateSummary(courseId: number) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post<Summary>('/ai/generate-summary', {
        course_id: courseId,
        content: ''
      })
      if (currentCourse.value?.id === courseId) {
        currentCourse.value.summary = response.data
      }
      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchTest(courseId: number) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<Test>(`/tests/course/${courseId}/full`)
      if (currentCourse.value?.id === courseId) {
        currentCourse.value.test = response.data
      }
      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchTestForStudent(courseId: number) {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<Test>(`/tests/course/${courseId}`)
      if (currentCourse.value?.id === courseId) {
        currentCourse.value.test = response.data
      }
      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function generateTest(courseId: number) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post<Test>('/ai/generate-test', {
        course_id: courseId
      })
      if (currentCourse.value?.id === courseId) {
        currentCourse.value.test = response.data
      }
      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateSummary(summaryId: number, content: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.patch<Summary>(`/summaries/${summaryId}`, { content })
      // Обновляем конспект в currentCourse если он там есть
      if (currentCourse.value?.summary?.id === summaryId) {
        currentCourse.value.summary = response.data
      }
      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateTest(testId: number, questions: any[]) {
    loading.value = true
    error.value = null
    try {
      const response = await api.patch<Test>(`/tests/${testId}`, { questions })
      // Обновляем тест в currentCourse если он там есть
      if (currentCourse.value?.test?.id === testId) {
        currentCourse.value.test = response.data
      }
      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function submitTest(testId: number, answers: Array<{ question_id: number; selected_answer: string }>) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post<{
        score: number
        total: number
        passed: boolean
        percentage: number
      }>(`/tests/${testId}/submit`, { answers })
      return response.data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    courses,
    currentCourse,
    loading,
    error,
    fetchCourses,
    fetchCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    publishCourse,
    fetchSummary,
    generateSummary,
    fetchTest,
    fetchTestForStudent,
    generateTest,
    updateSummary,
    updateTest,
    submitTest
  }
})
