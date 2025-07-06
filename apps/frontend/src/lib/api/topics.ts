import { getAuth } from "firebase/auth"
import { API_BASE_URL } from "@/lib/api"

export interface TopicData {
  name: string
  prompt: string
  default: boolean
  created_at?: string | null
}

export async function fetchTopics(): Promise<TopicData[]> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/topics`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error("Failed to fetch topics")

  return await res.json()
}

export async function addTopic(topicData: {
  topic: string
  prompt_topic: string
  tests: Array<{
    test: string
    ground_truth: "acceptable" | "unacceptable"
  }>
  default?: boolean
}): Promise<{ message: string }> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/topics/add`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(topicData)
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to add topic")
  }

  return await res.json()
}

export async function deleteTopic(topic: string): Promise<{ message: string }> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/topics/delete`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ topic })
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to delete topic")
  }

  return await res.json()
}
