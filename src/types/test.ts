import type {User} from "@/types/auth.ts";

export interface Summary {
  id: number
  course_id: number
  content: string
  created_at: string
}

export interface Question {
  id: number
  question: string
  options: string[]
  correct_answer?: string // Только для методиста
}

export interface Test {
  id: number
  course_id: number
  questions: Question[]
  created_at: string
}

export interface TestSubmission {
  answers: Array<{
    question_id: number
    selected_answer: string
  }>
}

export interface TestAnswer {
  question_id: number
  question: string
  options: string[]
  selected_answer: string
  correct_answer: string
  is_correct: boolean
}

export interface TestResult {
  id: number
  test_id: number
  student_id: number
  answers: TestAnswer[]
  score: number
  total_questions: number
  submitted_at: string
  percentage: number
  passed: boolean
  student: User | null
  test: Test | null
}

export interface TestSubmitResponse {
  score: number
  total: number
  passed: boolean
  percentage: number
}
