"use client"

import { useEffect, useState } from "react"
import { getAuth } from "firebase/auth"
import { initializeViews } from "@/lib/api/views" // ✅ Add this
import { API_BASE_URL } from "@/lib/api"

export interface Topic {
  name: string
  url: string
  icon?: any
}

export function useTopics() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const user = getAuth().currentUser
        if (!user) return
        const token = await user.getIdToken()

        // ✅ Step 1: Initialize views
        await initializeViews()

        // ✅ Step 2: Fetch topics after views/init
        const res = await fetch(`${API_BASE_URL}/api/v1/topics/`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) throw new Error("Failed to fetch topics")

        const topicsList = await res.json()

        const formattedTopics: Topic[] = topicsList.map((name: string) => ({
          name,
          url: `/topics/${encodeURIComponent(name)}`,
        }))

        setTopics(formattedTopics)
      } catch (err) {
        console.error("Error fetching topics", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTopics()
  }, [])

  return { topics, loading }
}
