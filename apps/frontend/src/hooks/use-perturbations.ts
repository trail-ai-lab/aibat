"use client"

import { useState, useEffect } from "react"
import { fetchPerturbationsByTopic, type PerturbationResponse } from "@/lib/api/perturbations"

export function usePerturbations(topic?: string) {
  const [perturbations, setPerturbations] = useState<Map<string, PerturbationResponse[]>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPerturbations = async (topicName: string) => {
    if (!topicName) return

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetchPerturbationsByTopic(topicName)
      
      // Group perturbations by original test ID
      const perturbationMap = new Map<string, PerturbationResponse[]>()
      response.perturbations.forEach(perturbation => {
        const originalId = perturbation.original_id
        if (!perturbationMap.has(originalId)) {
          perturbationMap.set(originalId, [])
        }
        perturbationMap.get(originalId)!.push(perturbation)
      })
      
      setPerturbations(perturbationMap)
    } catch (err) {
      console.error("Error fetching perturbations:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch perturbations")
      setPerturbations(new Map())
    } finally {
      setLoading(false)
    }
  }

  const addPerturbations = (newPerturbations: Map<string, PerturbationResponse[]>) => {
    setPerturbations(prev => {
      const updated = new Map(prev)
      newPerturbations.forEach((perturbationList, originalId) => {
        if (updated.has(originalId)) {
          // Replace existing perturbations with new ones, using type as key to avoid duplicates
          const existing = updated.get(originalId)!
          const existingByType = new Map(existing.map(p => [p.type, p]))
          
          // Update or add new perturbations
          perturbationList.forEach(newPert => {
            existingByType.set(newPert.type, newPert)
          })
          
          updated.set(originalId, Array.from(existingByType.values()))
        } else {
          updated.set(originalId, perturbationList)
        }
      })
      return updated
    })
  }

  const clearPerturbations = () => {
    setPerturbations(new Map())
    setError(null)
  }

  // Auto-fetch when topic changes
  useEffect(() => {
    if (topic) {
      fetchPerturbations(topic)
    } else {
      clearPerturbations()
    }
  }, [topic])

  return {
    perturbations,
    loading,
    error,
    fetchPerturbations,
    addPerturbations,
    clearPerturbations,
  }
}