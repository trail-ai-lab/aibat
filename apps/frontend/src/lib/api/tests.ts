import { getAuth } from "firebase/auth"
import { API_BASE_URL } from "@/lib/api"

export interface TestResponse {
  id: string
  topic: string
  statement: string
  ground_truth: "acceptable" | "unacceptable"
  your_assessment: "ungraded" | "acceptable" | "unacceptable"
  ai_assessment: "pass" | "fail"
  agreement: boolean
  labeler: string
  description?: string
  author?: string
  model_score?: string
  is_builtin?: boolean
}

export interface TopicTestsResponse {
  topic: string
  total_tests: number
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

export async function fetchTestsByTopic(topic: string): Promise<TopicTestsResponse> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/tests/topic/${encodeURIComponent(topic)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to fetch tests for topic ${topic}`)
  }

  return await res.json()
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