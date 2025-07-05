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

export interface PerturbationResponse {
  id: string
  original_id: string
  title: string
  label: "pass" | "fail"
  type: string
  topic: string
  ground_truth: "acceptable" | "unacceptable"
  validity: "approved" | "denied" | "unapproved"
}

export interface GeneratePerturbationsRequest {
  topic: string
  test_ids: string[]
  criteria_types?: string[]
}

export interface GeneratePerturbationsResponse {
  message: string
  perturbations: PerturbationResponse[]
}

export async function generatePerturbations(perturbationData: GeneratePerturbationsRequest): Promise<GeneratePerturbationsResponse> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/perturbations/generate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(perturbationData)
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to generate perturbations")
  }

  return await res.json()
}

export async function getPerturbationsByTopic(topic: string): Promise<PerturbationResponse[]> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/perturbations/topic/${encodeURIComponent(topic)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Failed to fetch perturbations for topic ${topic}`)
  }

  return await res.json()
}

export interface CriteriaType {
  name: string
  is_custom: boolean
  is_default: boolean
}

export interface CriteriaInfo {
  name: string
  prompt: string
  flip_label: boolean
}

export interface AddCustomCriteriaRequest {
  name: string
  prompt: string
  flip_label: boolean
}

export interface TestCriteriaPromptRequest {
  prompt: string
  test_case: string
}

export interface TestCriteriaPromptResponse {
  perturbed: string
}

export async function getAllPerturbationTypes(): Promise<CriteriaType[]> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/perturbations/criteria/types`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to fetch criteria types")
  }

  const data = await res.json()
  return data.criteria_types || []
}

export async function getPerturbationInfo(criteriaName: string): Promise<CriteriaInfo> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/perturbations/criteria/info/${encodeURIComponent(criteriaName)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to fetch criteria info")
  }

  return await res.json()
}

export async function addCustomPerturbation(criteriaData: AddCustomCriteriaRequest): Promise<{ message: string }> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/perturbations/criteria/add`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pert_name: criteriaData.name,
      prompt: criteriaData.prompt,
      flip_label: criteriaData.flip_label,
      test_list: []
    })
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to add custom criteria")
  }

  return await res.json()
}

export async function editPerturbation(criteriaData: AddCustomCriteriaRequest): Promise<{ message: string }> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/perturbations/criteria/edit`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pert_name: criteriaData.name,
      prompt: criteriaData.prompt,
      flip_label: criteriaData.flip_label,
      test_list: []
    })
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to edit criteria")
  }

  return await res.json()
}

export async function deletePerturbationType(criteriaName: string): Promise<{ message: string }> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/perturbations/criteria/delete/${encodeURIComponent(criteriaName)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to delete criteria")
  }

  return await res.json()
}

export async function testNewPerturbation(testData: TestCriteriaPromptRequest): Promise<TestCriteriaPromptResponse> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/perturbations/criteria/test`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: testData.prompt,
      test_case: testData.test_case
    })
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to test criteria prompt")
  }

  return await res.json()
}

export async function getDefaultPerturbations(config: string): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/perturbations/defaults/${encodeURIComponent(config)}`, {
    headers: {
      'Content-Type': 'application/json'
    },
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to fetch default criteria")
  }

  const data = await res.json()
  return data.default_types || []
}