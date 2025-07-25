import { getAuth } from "firebase/auth"
import { API_BASE_URL } from "@/lib/api"

export interface TestResponse {
  id: string
  topic: string
  title: string  // formerly 'statement'
  ground_truth: "acceptable" | "unacceptable" | "ungraded"
  label: "acceptable" | "unacceptable" | "ungraded" | "grading" // maps to ai_assessment
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
    title: string
    ground_truth: "acceptable" | "unacceptable"
  }>
}

export interface GenerateStatementsRequest {
  topic: string
  criteria?: string
  num_statements?: number
}

export interface GenerateStatementsResponse {
  added_count: number
  test_ids: string[]
}

export async function fetchTestsByTopic(topic: string): Promise<TopicTestsResponse> {
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
  console.log("fetchTestsByTopic", data)
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

  const res = await fetch(`${API_BASE_URL}/api/v1/tests/assess`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ test_id: testId, assessment })
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

  const res = await fetch(`${API_BASE_URL}/api/v1/tests/add`, {
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

export interface EditTestRequest {
  title?: string
  ground_truth?: "acceptable" | "unacceptable" | "ungraded"
}

export async function editTest(testId: string, updates: EditTestRequest): Promise<{ message: string }> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/tests/edit`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tests: [{
        id: testId,
        ...updates
      }]
    })
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to edit test")
  }

  return await res.json()
}

export interface DeleteTestsRequest {
  test_ids: string[]
}

export interface DeleteTestsResponse {
  deleted_count: number
}

export async function deleteTests(testIds: string[]): Promise<DeleteTestsResponse> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/tests/delete`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ test_ids: testIds })
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to delete tests")
  }

  return await res.json()
}

export interface AutoGradeTestsRequest {
  test_ids: string[]
}

export interface AutoGradeTestsResponse {
  graded_count: number
  results: Array<{
    test_id: string
    statement: string
    ai_assessment: string
  }>
}

export async function autoGradeTests(testIds: string[]): Promise<AutoGradeTestsResponse> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/tests/auto-grade`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ test_ids: testIds })
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to auto grade tests")
  }

  return await res.json()
}