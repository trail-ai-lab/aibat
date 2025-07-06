export interface TopicResponse {
  name: string
  prompt: string
  default: boolean
  created_at?: string
  test_count?: number
}

export interface Topic {
  name: string
  url: string
  icon?: any
  isBuiltin: boolean
  prompt: string
  createdAt?: string | null
  testCount?: number
}