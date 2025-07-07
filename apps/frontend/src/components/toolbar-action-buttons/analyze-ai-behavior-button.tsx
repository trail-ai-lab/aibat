// apps/frontend/src/components/ai-behavior-analyzer.tsx

"use client"

import * as React from "react"
import { IconLoader, IconTrendingUp } from "@tabler/icons-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { generatePerturbations } from "@/lib/api/perturbations"
import { PerturbationResponse } from "@/types/perturbations"

interface AnalyzeAIBehaviorButtonProps {
  currentTopic?: string
  selectedRowsCount: number
  selectedTestIds: string[]
  isGeneratingPerturbations: boolean
  onGeneratingChange: (isGenerating: boolean) => void
  onPerturbationsGenerated: (perturbations: Map<string, PerturbationResponse[]>) => void
  onShowCriteriaColumn: () => void
}

export function AnalyzeAIBehaviorButton({
  currentTopic,
  selectedRowsCount,
  selectedTestIds,
  isGeneratingPerturbations,
  onGeneratingChange,
  onPerturbationsGenerated,
  onShowCriteriaColumn,
}: AnalyzeAIBehaviorButtonProps) {
  const handleAnalyzeAIBehavior = async () => {
    console.log("Analyze AI Behavior button clicked!")
    console.log("Current topic:", currentTopic)
    
    if (!currentTopic) {
      console.log("No topic selected")
      toast.error("Please select a topic first")
      return
    }

    console.log("Selected rows:", selectedRowsCount)
    
    if (selectedRowsCount === 0) {
      console.log("No rows selected")
      toast.error("Please select at least one test statement")
      return
    }

    console.log("Setting loading state...")
    onGeneratingChange(true)
    
    try {
      console.log("Test IDs to generate perturbations for:", selectedTestIds)
      
      console.log("Calling generatePerturbations API...")
      const result = await generatePerturbations({
        topic: currentTopic,
        test_ids: selectedTestIds
      })
      
      console.log("API response:", result)

      // Group perturbations by original test ID
      const perturbationMap = new Map<string, PerturbationResponse[]>()
      result.perturbations.forEach(perturbation => {
        const originalId = perturbation.original_id
        if (!perturbationMap.has(originalId)) {
          perturbationMap.set(originalId, [])
        }
        perturbationMap.get(originalId)!.push(perturbation)
      })

      console.log("Perturbation map:", perturbationMap)
      onPerturbationsGenerated(perturbationMap)
      
      // Show the criteria column now that we have perturbations
      onShowCriteriaColumn()
      
      toast.success(`Generated ${result.perturbations.length} perturbations for ${selectedRowsCount} test statements`)
    } catch (error) {
      console.error("Error generating perturbations:", error)
      toast.error("Failed to generate perturbations. Please try again.")
    } finally {
      console.log("Clearing loading state...")
      onGeneratingChange(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={!currentTopic || isGeneratingPerturbations}
      onClick={handleAnalyzeAIBehavior}
      title={!currentTopic ? "Select a topic to analyze AI behavior" : "Generate perturbations for selected test statements"}
    >
      {isGeneratingPerturbations ? (
        <IconLoader className="animate-spin" />
      ) : (
        <IconTrendingUp />
      )}
      <span className="hidden lg:inline">
        {isGeneratingPerturbations ? "Analyzing..." : "Analyze AI Behavior"}
      </span>
    </Button>
  )
}