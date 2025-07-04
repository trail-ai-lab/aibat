import { API_BASE_URL } from "./index"

export interface Model {
  id: string
  name: string
}

export async function getAvailableModels(): Promise<Model[]> {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}/api/v1/models/available`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch available models')
  }

  return response.json()
}

export async function getCurrentModel(): Promise<Model> {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}/api/v1/models/current`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch current model')
  }

  return response.json()
}

export async function selectModel(modelId: string): Promise<void> {
  const token = await getAuthToken()
  const response = await fetch(`${API_BASE_URL}/api/v1/models/select`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: modelId }),
  })

  if (!response.ok) {
    throw new Error('Failed to select model')
  }
}

async function getAuthToken(): Promise<string> {
  // Import dynamically to avoid circular dependencies
  const { auth } = await import('../firebase')
  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }
  return await user.getIdToken()
}