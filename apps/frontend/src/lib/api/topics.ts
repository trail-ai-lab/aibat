import { getAuth } from "firebase/auth"
import { API_BASE_URL } from "@/lib/api"
import { TopicResponse } from "@/types/topics"


export async function fetchTopics(): Promise<TopicResponse[]> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/topics`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const error = await res.text()
    console.error("Failed to fetch topics", res.status, error)
    throw new Error("Failed to fetch topics")
  }


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

export async function editTopic(oldTopic: string, newTopic: string, prompt: string): Promise<{ message: string }> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")

  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/topics/edit`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ old_topic: oldTopic, new_topic: newTopic, prompt })
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.detail || "Failed to edit topic")
  }

  return await res.json()
}
