export interface CaseQuestion {
  id: number
  question: string
  answer: string
  case_id: number
  created_by: number
  created_at: string
  updated_at: string
}

export interface CaseQuestionForStudent {
  id: number
  case_id: number
  question: string
  created_at: string
  updated_at: string
}

export interface SubmitCaseAnswerRequest {
  answer: string
  test_id: number
}

export interface CaseAnswerResult {
  answer: string
  file_url: string
  id: number
  test_id: number
  student_id: number
  score: number
  created_at: string
  updated_at: string
}

export interface Case {
  id: number
  title: string
  description: string
  cleaning_text?: string
  created_by: number
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
  questions?: CaseQuestion[]
}

export interface CreateCaseRequest {
  title: string
  description: string
  cleaning_text?: string
}
