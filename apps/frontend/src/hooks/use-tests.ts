"use client"

import { useState, useEffect, useRef } from "react"
import { fetchTestsByTopic, type TestResponse, type TopicTestsResponse } from "@/lib/api/tests"

export function useTests(topic?: string, modelId?: string) {
  const [tests, setTests] = useState<TestResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTopic, setCurrentTopic] = useState<string | null>(topic || null)
  const [currentModelId, setCurrentModelId] = useState<string | null>(modelId || null)
  const [totalTests, setTotalTests] = useState(0)
  const lastFetchRef = useRef<string | null>(null)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchTests = async (topicName: string, forceRefresh: boolean = false) => {
    if (!topicName) return

    // Prevent duplicate calls for the same topic
    if (lastFetchRef.current === topicName && !forceRefresh) {
      return
    }

    // Clear any pending fetch timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }

    console.log(`🔍 fetchTests called for topic: ${topicName}, forceRefresh: ${forceRefresh}`)
    lastFetchRef.current = topicName
    setLoading(true)
    setError(null)
    
    try {
      console.log(`📡 Making API call to /api/v1/tests/topic/${topicName}`)
      const response = await fetchTestsByTopic(topicName)
      console.log(`✅ API call successful for topic: ${topicName}`)
      setTests(response.tests)
      setTotalTests(response.total_tests)
      setCurrentTopic(topicName)
    } catch (err) {
      console.error(`❌ Error fetching tests for topic ${topicName}:`, err)
      setError(err instanceof Error ? err.message : "Failed to fetch tests")
      setTests([])
      setTotalTests(0)
      
      // Reset lastFetch on error to allow retry
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

  // Auto-fetch when topic changes with debouncing
  useEffect(() => {
    console.log(`🎯 useTests useEffect triggered - topic: ${topic}, currentTopic: ${currentTopic}`)
    if (topic && topic !== currentTopic) {
      console.log(`🔄 Topic changed from ${currentTopic} to ${topic}, scheduling fetch`)
      
      // Clear any existing timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
      
      // Debounce the fetch call
      fetchTimeoutRef.current = setTimeout(() => {
        fetchTests(topic)
      }, 100) // 100ms debounce
    }
  }, [topic, currentTopic])

  // Refetch when model changes for the same topic
  useEffect(() => {
    console.log(`🤖 Model useEffect triggered - modelId: ${modelId}, currentModelId: ${currentModelId}, currentTopic: ${currentTopic}`)
    if (modelId && modelId !== currentModelId && currentTopic) {
      console.log(`🔄 Model changed from ${currentModelId} to ${modelId}, refetching tests for topic ${currentTopic}`)
      setCurrentModelId(modelId)
      fetchTests(currentTopic, true) // Force refresh when model changes
    }
  }, [modelId, currentModelId, currentTopic])

  // Cleanup timeouts on unmount
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
