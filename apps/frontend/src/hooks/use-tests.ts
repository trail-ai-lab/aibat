"use client"

import { useState, useEffect } from "react"
import { fetchTestsByTopic, type TestResponse, type TopicTestsResponse } from "@/lib/api/tests"

export function useTests(topic?: string) {
  const [tests, setTests] = useState<TestResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTopic, setCurrentTopic] = useState<string | null>(topic || null)
  const [totalTests, setTotalTests] = useState(0)

  const fetchTests = async (topicName: string) => {
    if (!topicName) return

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetchTestsByTopic(topicName)
      setTests(response.tests)
      setTotalTests(response.total_tests)
      setCurrentTopic(topicName)
    } catch (err) {
      console.error("Error fetching tests:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch tests")
      setTests([])
      setTotalTests(0)
    } finally {
      setLoading(false)
    }
  }

  const clearTests = () => {
    setTests([])
    setCurrentTopic(null)
    setTotalTests(0)
    setError(null)
  }

  // Auto-fetch when topic changes
  useEffect(() => {
    if (topic && topic !== currentTopic) {
      fetchTests(topic)
    }
  }, [topic, currentTopic])

  return {
    tests,
    loading,
    error,
    currentTopic,
    totalTests,
    fetchTests,
    clearTests,
  }
}