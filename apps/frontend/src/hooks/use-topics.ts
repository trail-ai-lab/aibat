"use client"

import { useEffect, useState } from "react"
import { getAuth } from "firebase/auth"
import { fetchTopics, type TopicData } from "@/lib/api/topics"

export interface Topic {
  name: string
  url: string
  icon?: any
  isBuiltin: boolean
  prompt: string
}

export function useTopics() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedTopic")
    }
    return null
  })

  const refreshTopics = async () => {
    try {
      const user = getAuth().currentUser
      if (!user) return

      const topicsData: TopicData[] = await fetchTopics()

      const formattedTopics: Topic[] = topicsData.map((topicData) => ({
        name: topicData.name,
        url: `/topics/${encodeURIComponent(topicData.name)}`,
        isBuiltin: topicData.default,
        prompt: topicData.prompt,
      }))

      setTopics(formattedTopics)

      if (!selectedTopic && formattedTopics.length > 0) {
        const first = formattedTopics[0].name
        setSelectedTopic(first)
        localStorage.setItem("selectedTopic", first)
      }
    } catch (err) {
      console.error("Error fetching topics", err)
    } finally {
      setLoading(false)
    }
  }

  const selectTopic = (topicName: string) => {
    setSelectedTopic(topicName)
    localStorage.setItem("selectedTopic", topicName)
  }

  useEffect(() => {
    refreshTopics()
  }, [])

  const selected = topics.find((t) => t.name === selectedTopic) ?? null

  return {
    topics,
    loading,
    selectedTopic,
    selectedTopicData: selected,
    selectTopic,
    refreshTopics,
  }
}
