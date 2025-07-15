"use client"

import { useState, useEffect, useRef } from "react"
import { fetchTestsByTopic, autoGradeTests, deleteTests, type TestResponse } from "@/lib/api/tests"

export function useTests(topic?: string, modelId?: string) {
  const [tests, setTests] = useState<TestResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTopic, setCurrentTopic] = useState<string | null>(null)
  const [currentModelId, setCurrentModelId] = useState<string | null>(null)

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
      
      // Set tests and stop loading immediately to show the table
      setTests(response.tests)
      setCurrentTopic(topicName)
      setLoading(false) // Stop loading here so table shows immediately
      
      // Auto grade ungraded tests in the background
      const ungradedTests = response.tests.filter(test => test.label === "ungraded")
      if (ungradedTests.length > 0) {
        console.log(`🤖 Auto grading ${ungradedTests.length} ungraded tests in background...`)
        
        // Update the tests to show "grading" state immediately
        const testsWithGradingState = response.tests.map(test =>
          ungradedTests.some(ungraded => ungraded.id === test.id)
            ? { ...test, label: "grading" as const }
            : test
        )
        setTests(testsWithGradingState)
        
        // Do auto grading in background without affecting loading state
        setTimeout(async () => {
          try {
            const ungradedTestIds = ungradedTests.map(test => test.id)
            await autoGradeTests(ungradedTestIds)
            
            // Refresh tests to get the updated grades
            const updatedResponse = await fetchTestsByTopic(topicName)
            setTests(updatedResponse.tests)
            console.log(`✅ Auto grading completed for ${ungradedTests.length} tests`)
          } catch (gradingError) {
            console.error("❌ Error during auto grading:", gradingError)
            // Revert grading state on error
            setTests(response.tests)
          }
        }, 100) // Small delay to ensure UI updates first
      }
    } catch (err) {
      console.error(`❌ Error fetching tests for topic ${topicName}:`, err)
      setError(err instanceof Error ? err.message : "Failed to fetch tests")
      setTests([])
      lastFetchRef.current = null
      setLoading(false)
    }
  }

  const clearTests = () => {
    setTests([])
    setCurrentTopic(null)
    setCurrentModelId(null)
    setError(null)
  }

  const updateTestAssessment = (testId: string, assessment: "acceptable" | "unacceptable") => {
    setTests(prevTests =>
      prevTests.map(test =>
        test.id === testId
          ? { ...test, ground_truth: assessment }
          : test
      )
    )
  }

  const updateTestStatement = (testId: string, updates: { title?: string; ground_truth?: "acceptable" | "unacceptable" | "ungraded" }) => {
    setTests(prevTests =>
      prevTests.map(test =>
        test.id === testId
          ? { ...test, ...updates }
          : test
      )
    )
  }

  const deleteTestsById = async (testIds: string[]) => {
    try {
      await deleteTests(testIds)
      // Remove deleted tests from local state
      setTests(prevTests =>
        prevTests.filter(test => !testIds.includes(test.id))
      )
      return { success: true }
    } catch (error) {
      console.error("Error deleting tests:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete tests"
      }
    }
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
    fetchTests,
    clearTests,
    updateTestAssessment,
    updateTestStatement,
    deleteTestsById,
  }
}

export { TestResponse }
