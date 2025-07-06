"use client"

import { useState, useEffect, useRef } from "react"
import { fetchTestsByTopic, type TestResponse } from "@/lib/api/tests"

export function useTests(topic?: string, modelId?: string) {
  const [tests, setTests] = useState<TestResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTopic, setCurrentTopic] = useState<string | null>(null)
  const [currentModelId, setCurrentModelId] = useState<string | null>(null)
  const [totalTests, setTotalTests] = useState(0)

  const lastFetchRef = useRef<string | null>(null)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchTests = async (topicName: string, forceRefresh: boolean = false) => {
    if (!topicName) return

    if (lastFetchRef.current === topicName && !forceRefresh) return

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }
    lastFetchRef.current = topicName
    setLoading(true)
    setError(null)

    try {
      const response = await fetchTestsByTopic(topicName)
      console.log(`✅ API call successful for topic: ${topicName}`)
      console.log(response.tests)
      setTests(response.tests)
      setTotalTests(response.total_tests)
      setCurrentTopic(topicName)
    } catch (err) {
      console.error(`❌ Error fetching tests for topic ${topicName}:`, err)
      setError(err instanceof Error ? err.message : "Failed to fetch tests")
      setTests([])
      setTotalTests(0)
      lastFetchRef.current = null
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

  // Debounced fetch when topic changes
  useEffect(() => {
    if (!topic) return

    if (topic !== currentTopic) {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
      fetchTimeoutRef.current = setTimeout(() => {
        fetchTests(topic)
      }, 100)
    }
  }, [topic, currentTopic])

  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [])

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

export { TestResponse }
