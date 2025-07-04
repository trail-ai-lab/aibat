"use client"

import { useState, useEffect } from "react"
import { fetchTestsByTopic, type TestResponse, type TopicTestsResponse } from "@/lib/api/tests"

export function useTests(topic?: string, modelId?: string) {
  const [tests, setTests] = useState<TestResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTopic, setCurrentTopic] = useState<string | null>(topic || null)
  const [currentModelId, setCurrentModelId] = useState<string | null>(modelId || null)
  const [totalTests, setTotalTests] = useState(0)

  const fetchTests = async (topicName: string, forceRefresh: boolean = false) => {
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
    setCurrentModelId(null)
    setTotalTests(0)
    setError(null)
  }

  // Auto-fetch when topic changes
  useEffect(() => {
    if (topic && topic !== currentTopic) {
      fetchTests(topic)
    }
  }, [topic, currentTopic])

  // Refetch when model changes for the same topic
  useEffect(() => {
    if (modelId && modelId !== currentModelId && currentTopic) {
      console.log(`Model changed from ${currentModelId} to ${modelId}, refetching tests for topic ${currentTopic}`)
      setCurrentModelId(modelId)
      fetchTests(currentTopic, true) // Force refresh when model changes
    }
  }, [modelId, currentModelId, currentTopic])

  return {
    tests,
    loading,
    error,
    currentTopic,
    currentModelId,
    totalTests,
    fetchTests,
    clearTests,
  }
}