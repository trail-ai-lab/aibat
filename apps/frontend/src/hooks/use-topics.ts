"use client"

import { useEffect, useState } from "react"
import { getAuth } from "firebase/auth"
import { initializeViews } from "@/lib/api/views"
import { fetchAvailableTopics, type AvailableTopicsResponse } from "@/lib/api/tests"

export interface Topic {
  name: string
  url: string
  icon?: any
  isBuiltin: boolean
}

export function useTopics() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)

  const refreshTopics = async () => {
    try {
      const user = getAuth().currentUser
      if (!user) return

      // Initialize views
      await initializeViews()

      // Fetch available topics (both builtin and user-created)
      const availableTopics: AvailableTopicsResponse = await fetchAvailableTopics()

      const formattedTopics: Topic[] = [
        // Built-in topics
        ...availableTopics.builtin.map((name: string) => ({
          name,
          url: `/topics/${encodeURIComponent(name)}`,
          isBuiltin: true,
        })),
        // User-created topics
        ...availableTopics.user_created.map((name: string) => ({
          name,
          url: `/topics/${encodeURIComponent(name)}`,
          isBuiltin: false,
        })),
      ]

      setTopics(formattedTopics)
    } catch (err) {
      console.error("Error fetching topics", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshTopics()
  }, [])

  return { topics, loading, refreshTopics }
}
