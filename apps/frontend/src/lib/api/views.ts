import { getAuth } from "firebase/auth"
import { API_BASE_URL } from "@/lib/api"

export async function initializeViews(): Promise<void> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")
  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/views/init/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) throw new Error("Failed to initialize user data")
}
