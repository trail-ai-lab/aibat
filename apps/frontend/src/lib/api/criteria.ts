import { getAuth } from "firebase/auth"
import { API_BASE_URL } from "@/lib/api"
import { CriteriaTypeInput, DefaultCriteriaItem } from "@/types/criteria"

export async function fetchDefaultCriteria(): Promise<DefaultCriteriaItem[]> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/criteria/defaults`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to fetch default criteria")
  }

  return await res.json()
}

export async function fetchUserCriteria(topic: string): Promise<CriteriaTypeInput[]> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")
  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/criteria/user/${encodeURIComponent(topic)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to fetch user criteria")
  }

  const data = await res.json()
  return data.types || []
}

export async function saveUserCriteria(topic: string, types: CriteriaTypeInput[]) {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")
  const token = await user.getIdToken()
  const res = await fetch(`${API_BASE_URL}/api/v1/criteria/user/save`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ topic, types }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to save user criteria")
  }

  return await res.json()
}

