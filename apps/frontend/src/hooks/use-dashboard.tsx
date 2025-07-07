// apps/frontend/src/hooks/use-dashboard.ts

import { useState, useEffect, useCallback } from "react"
import { useTests } from "./use-tests"
import { fetchTopics, deleteTopic as deleteTopicAPI, editTopic as editTopicAPI } from "@/lib/api/topics"
import { Topic, TopicResponse } from "@/types/topics"

export function useDashboard(selectedModel: string | undefined) {
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [topicPrompt, setTopicPrompt] = useState<string | null>(null)
  const [topicsLoading, setTopicsLoading] = useState<boolean>(true)
  const [pendingSelection, setPendingSelection] = useState<string | null>(null)

  const {
    tests,
    loading,
    error,
    currentTopic,
    fetchTests
  } = useTests(selectedTopic || undefined, selectedModel)

  const refreshTopics = useCallback(async () => {
    try {
      setTopicsLoading(true)
      const data: TopicResponse[] = await fetchTopics()
      console.log(data)

      const formatted: Topic[] = data.map((t) => ({
        name: t.name,
        url: `/topics/${encodeURIComponent(t.name)}`,
        isBuiltin: t.default,
        prompt: t.prompt,
        testCount: t.test_count ?? 0,
        createdAt: t.created_at ?? null,
      }))

      setTopics(formatted)

      if (!selectedTopic && formatted.length > 0) {
        const first = formatted[0].name
        setSelectedTopic(first)
        localStorage.setItem("selectedTopic", first)
      }
    } catch (error) {
      console.error("Error refreshing topics:", error)
    } finally {
      setTopicsLoading(false)
    }
  }, [selectedTopic])

  const handleTopicSelect = useCallback((topic: string) => {
    setSelectedTopic(topic)

    const topicData = topics.find(t => t.name === topic)
    setTopicPrompt(topicData?.prompt || null)
    localStorage.setItem("selectedTopic", topic)
  }, [topics])

  const handleTopicCreated = async (topicName: string) => {
    setPendingSelection(topicName)
    await refreshTopics()
  }

  const handleTopicDelete = async (topicName: string) => {
    try {
      await deleteTopicAPI(topicName)
      await refreshTopics()
      if (selectedTopic === topicName) {
        setSelectedTopic(null)
        setTopicPrompt(null)
        localStorage.removeItem("selectedTopic")
      }
    } catch (error) {
      console.error("Failed to delete topic:", error)
    }
  }

  const handleTopicEdit = async (oldName: string, newName: string, newPrompt: string) => {
    try {
        await editTopicAPI(oldName, newName, newPrompt)
        await refreshTopics()

        if (selectedTopic === oldName) {
        setSelectedTopic(newName)
        localStorage.setItem("selectedTopic", newName)
        }
    } catch (err) {
        console.error("Failed to edit topic:", err)
        throw err
    }
    }

  // Restore selected topic from localStorage on load
  useEffect(() => {
    if (!topics.length) return
    const saved = localStorage.getItem("selectedTopic")
    if (saved && topics.some(t => t.name === saved)) {
        handleTopicSelect(saved)
    }
    }, [topics, handleTopicSelect])

  // Auto-select after creation
  useEffect(() => {
    if (pendingSelection && topics.some(t => t.name === pendingSelection)) {
      handleTopicSelect(pendingSelection)
      setPendingSelection(null)
    }
  }, [pendingSelection, topics, handleTopicSelect])

  useEffect(() => {
    refreshTopics()
    }, [refreshTopics])

  return {
    selectedTopic,
    topicPrompt,
    tests,
    loading,
    error,
    currentTopic,
    topics,
    topicsLoading,
    handleTopicSelect,
    handleTopicCreated,
    handleTopicDelete,
    handleTopicEdit,
    refreshTopics,
    refreshTests: () => selectedTopic && fetchTests(selectedTopic, true),
  }
}
