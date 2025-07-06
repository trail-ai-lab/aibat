import { useState, useEffect, useCallback } from "react"
import { useTopics } from "./use-topics"
import { useTests } from "./use-tests"

export function useDashboard(selectedModel: string | undefined) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [topicPrompt, setTopicPrompt] = useState<string | null>(null)
  const [pendingSelection, setPendingSelection] = useState<string | null>(null)

  const { topics, refreshTopics, selectTopic, loading: topicsLoading } = useTopics()

  const {
    tests,
    loading,
    error,
    totalTests,
    currentTopic,
    fetchTests,
    clearTests,
    currentModelId
  } = selectedTopic
    ? useTests(selectedTopic, selectedModel)
    : {
        tests: [],
        loading: false,
        error: null,
        totalTests: 0,
        currentTopic: null,
        fetchTests: () => {},
        clearTests: () => {},
        currentModelId: null,
      }

  const handleTopicSelect = useCallback((topic: string) => {
    setSelectedTopic(topic)
    selectTopic(topic)

    const topicData = topics.find(t => t.name === topic)
    setTopicPrompt(topicData?.prompt || null)
  }, [topics, selectTopic])

  const handleTopicCreated = async (topicName: string) => {
    setPendingSelection(topicName)
    await refreshTopics()
  }

  // Restore selected topic from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("selectedTopic")
    if (saved && topics.some(t => t.name === saved)) {
      handleTopicSelect(saved)
    }
  }, [topics, handleTopicSelect])

  // Store current topic to localStorage
  useEffect(() => {
    if (selectedTopic) {
      localStorage.setItem("selectedTopic", selectedTopic)
    } else {
      localStorage.removeItem("selectedTopic")
    }
  }, [selectedTopic])

  // After topic is created and refreshed
  useEffect(() => {
    if (pendingSelection && topics.some(t => t.name === pendingSelection)) {
      handleTopicSelect(pendingSelection)
      setPendingSelection(null)
    }
  }, [pendingSelection, topics, handleTopicSelect])

  return {
    selectedTopic,
    topicPrompt,
    tests,
    loading,
    error,
    totalTests,
    currentTopic,
    topics,
    topicsLoading,
    handleTopicSelect,
    handleTopicCreated,
    refreshTopics,
  }
}
