export interface User {
  id: number
  email: string
  full_name: string
  role: 'student' | 'methodist'
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
  role: 'student' | 'methodist'
}

export interface AuthResponse {
  access_token: string
  token_type: string
}
