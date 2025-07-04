import { useState, useEffect } from 'react'
import { getAvailableModels, getCurrentModel, selectModel, type Model } from '@/lib/api/models'
import { toast } from 'sonner'

export function useModels() {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>('groq-llama3') // Default model

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch models'
      setError(errorMessage)
      console.error('Error fetching models:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleModelSelect = async (modelId: string) => {
    try {
      await selectModel(modelId)
      setSelectedModel(modelId)
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
    handleModelSelect,
    refetch: fetchModels,
  }
}