export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getTopics() {
  const res = await fetch(`${API_BASE_URL}/api/v1/topics/`);
  if (!res.ok) throw new Error("Failed to fetch topics");
  return res.json();
}
