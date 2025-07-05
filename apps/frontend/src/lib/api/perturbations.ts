import { getAuth } from "firebase/auth"
import { API_BASE_URL } from "@/lib/api"

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

export async function fetchPerturbationsByTopic(topic: string): Promise<GeneratePerturbationsResponse> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/perturbations/topic/${encodeURIComponent(topic)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to fetch perturbations")
  }

  return await res.json()
}