import type { Summary, Test } from './test'

export interface Course {
  id: number
  title: string
  description: string
  original_text: string
  file_url?: string
  created_by: number
  status: 'draft' | 'published'
  created_at: string
  summary?: Summary
  test?: Test
}

export interface CreateCourseRequest {
  title: string
  description: string
  original_text?: string
  file_url?: string
}
