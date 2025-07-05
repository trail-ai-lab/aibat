import { getAuth } from "firebase/auth"
import { API_BASE_URL } from "@/lib/api"

export async function triggerOnboarding(): Promise<void> {
  const user = getAuth().currentUser
  if (!user) throw new Error("User not authenticated")
  const token = await user.getIdToken()

  const res = await fetch(`${API_BASE_URL}/api/v1/onboard`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error("Onboarding failed")
}
