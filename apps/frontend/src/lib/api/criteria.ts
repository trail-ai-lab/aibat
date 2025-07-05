import { getAuth } from "firebase/auth"
import { API_BASE_URL } from "@/lib/api"

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
  topic: string
}

export interface EditCriteriaRequest {
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

export async function getAllCriteriaTypes(): Promise<CriteriaType[]> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/criteria/types`, {
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

export async function getCriteriaInfo(criteriaName: string): Promise<CriteriaInfo> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/criteria/type/${encodeURIComponent(criteriaName)}`, {
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

export async function addCustomCriteria(criteriaData: AddCustomCriteriaRequest): Promise<{ message: string }> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/criteria/add-type`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(criteriaData)
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to add custom criteria")
  }

  return await res.json()
}

export async function editCriteria(criteriaData: EditCriteriaRequest): Promise<{ message: string }> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/criteria/edit-type`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(criteriaData)
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to edit criteria")
  }

  return await res.json()
}

export async function deleteCriteria(criteriaName: string): Promise<{ message: string }> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/criteria/delete-type/${encodeURIComponent(criteriaName)}`, {
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

export async function testCriteriaPrompt(testData: TestCriteriaPromptRequest): Promise<TestCriteriaPromptResponse> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/criteria/test-prompt`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testData)
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to test criteria prompt")
  }

  return await res.json()
}

export async function getDefaultCriteria(config: string): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/criteria/defaults/${encodeURIComponent(config)}`, {
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