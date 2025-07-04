import { useState, useEffect } from 'react'
import { getAvailableModels, getCurrentModel, selectModel, type Model } from '@/lib/api/models'
import { clearTopicCache } from '@/lib/api/tests'
import { toast } from 'sonner'

export function useModels() {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>('groq-llama3') // Default model
  const [previousModel, setPreviousModel] = useState<string | null>(null)

  const fetchModels = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch both available models and current model in parallel
      const [availableModels, currentModel] = await Promise.all([
        getAvailableModels(),
        getCurrentModel()
      ])
      
      setModels(availableModels)
      setSelectedModel(currentModel.id)
      setPreviousModel(currentModel.id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch models'
      setError(errorMessage)
      console.error('Error fetching models:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleModelSelect = async (modelId: string, currentTopic?: string) => {
    try {
      const previousModelId = selectedModel
      
      await selectModel(modelId)
      setSelectedModel(modelId)
      setPreviousModel(previousModelId)
      
      // Clear cache for current topic if provided
      if (currentTopic && previousModelId !== modelId) {
        try {
          await clearTopicCache(currentTopic, previousModelId)
          console.log(`Cleared cache for topic ${currentTopic} and previous model ${previousModelId}`)
        } catch (cacheError) {
          console.warn('Failed to clear cache, but model selection succeeded:', cacheError)
        }
      }
      
      toast.success(`Model changed to ${models.find(m => m.id === modelId)?.name || modelId}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to select model'
      toast.error(errorMessage)
      console.error('Error selecting model:', err)
    }
  }

  useEffect(() => {
    fetchModels()
  }, [])

  return {
    models,
    loading,
    error,
    selectedModel,
    previousModel,
    handleModelSelect,
    refetch: fetchModels,
  }
}