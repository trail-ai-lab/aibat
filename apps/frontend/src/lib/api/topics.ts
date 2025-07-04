import { getAuth } from "firebase/auth"
import { API_BASE_URL } from "@/lib/api"

export async function fetchTopics(): Promise<string[]> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/topics/`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error("Failed to fetch topics")

  return await res.json()
}

export async function fetchTopicPrompt(topic: string): Promise<string | null> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/topics/${encodeURIComponent(topic)}/prompt`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    if (res.status === 404) return null // Topic has no prompt
    throw new Error("Failed to fetch topic prompt")
  }

  return await res.text()
}
