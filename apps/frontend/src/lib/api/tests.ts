import { getAuth } from "firebase/auth"
import { API_BASE_URL } from "@/lib/api"

export interface TestResponse {
  id: string
  topic: string
  title: string  // formerly 'statement'
  ground_truth: "acceptable" | "unacceptable" | "ungraded"
  label: "acceptable" | "unacceptable" | "ungraded" // maps to ai_assessment
  validity?: string // e.g., "approved" or null/undefined
  created_at?: string
}

export interface TopicTestsResponse {
  topic: string
  tests: TestResponse[]
}

export interface AvailableTopicsResponse {
  builtin: string[]
  user_created: string[]
}

export interface CreateTopicRequest {
  topic: string
  prompt_topic: string
  tests: Array<{
    test: string
    ground_truth: "acceptable" | "unacceptable"
  }>
}

export interface AddStatementsRequest {
  topic: string
  tests: Array<{
    test: string
    ground_truth: "acceptable" | "unacceptable"
  }>
}

export interface GenerateStatementsRequest {
  topic: string
  criteria?: string
  num_statements?: number
}

export interface GenerateStatementsResponse {
  message: string
  topic: string
  criteria: string
  generated_count: number
  statements: Array<{
    id: string
    statement: string
    ground_truth: "acceptable" | "unacceptable"
    your_assessment: "ungraded" | "acceptable" | "unacceptable"
    ai_assessment: "pass" | "fail" | "grading"
  }>
}

export async function fetchTestsByTopic(topic: string): Promise<TopicTestsResponse> {
  console.log(`🌐 fetchTestsByTopic API call starting for topic: ${topic}`)
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()
  const url = `${API_BASE_URL}/api/v1/tests/topic/${encodeURIComponent(topic)}`

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  })


  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to fetch tests for topic ${topic}`)
  }

  const data = await res.json()
  return data
}

export async function fetchAvailableTopics(): Promise<AvailableTopicsResponse> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/tests/topics/available`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  })

  if (!res.ok) {
    throw new Error("Failed to fetch available topics")
  }

  return await res.json()
}

export async function updateTestAssessment(testId: string, assessment: "acceptable" | "unacceptable"): Promise<{ message: string }> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/tests/assessment/${encodeURIComponent(testId)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ assessment })
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to update assessment")
  }

  return await res.json()
}

export async function clearTopicCache(topic: string, modelId: string): Promise<{ message: string }> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/tests/cache/clear/${encodeURIComponent(topic)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model_id: modelId })
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to clear cache")
  }

  return await res.json()
}

export async function createTopic(topicData: CreateTopicRequest): Promise<{ message: string; topic: string }> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/tests/topics/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(topicData)
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to create topic")
  }

  return await res.json()
}

export async function generateStatementsForTopic(generationData: GenerateStatementsRequest): Promise<GenerateStatementsResponse> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/tests/topics/generate-statements`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(generationData)
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to generate statements")
  }

  return await res.json()
}

export async function addStatementsToTopic(statementsData: AddStatementsRequest): Promise<{ message: string; topic: string }> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/tests/topics/add-statements`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(statementsData)
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to add statements to topic")
  }

  return await res.json()
}