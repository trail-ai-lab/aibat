"use client"

import * as React from "react"
import { ModelSelector } from "@/components/model-selector"
import { AIBehaviorAnalyzer } from "@/components/ai-behavior-analyzer"
import { CriteriaManager } from "@/components/criteria-manager"
import { TestManager } from "@/components/test-manager"
import { type PerturbationResponse } from "@/lib/api/perturbations"

interface TableActionsToolbarProps {
  currentTopic?: string
  selectedRowsCount: number
  selectedTestIds: string[]
  isGeneratingPerturbations: boolean
  onGeneratingChange: (isGenerating: boolean) => void
  onPerturbationsGenerated: (perturbations: Map<string, PerturbationResponse[]>) => void
  onShowCriteriaColumn: () => void
  isCriteriaEditorOpen: boolean
  onCriteriaEditorOpenChange: (open: boolean) => void
  isAddStatementsOpen: boolean
  onAddStatementsOpenChange: (open: boolean) => void
  isGenerateStatementsOpen: boolean
  onGenerateStatementsOpenChange: (open: boolean) => void
  onDataRefresh?: () => void
}

export function TableActionsToolbar({
  currentTopic,
  selectedRowsCount,
  selectedTestIds,
  isGeneratingPerturbations,
  onGeneratingChange,
  onPerturbationsGenerated,
  onShowCriteriaColumn,
  isCriteriaEditorOpen,
  onCriteriaEditorOpenChange,
  isAddStatementsOpen,
  onAddStatementsOpenChange,
  isGenerateStatementsOpen,
  onGenerateStatementsOpenChange,
  onDataRefresh,
}: TableActionsToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <ModelSelector currentTopic={currentTopic} />
      
      <CriteriaManager
        currentTopic={currentTopic}
        isOpen={isCriteriaEditorOpen}
        onOpenChange={onCriteriaEditorOpenChange}
      />
      
      <AIBehaviorAnalyzer
        currentTopic={currentTopic}
        selectedRowsCount={selectedRowsCount}
        selectedTestIds={selectedTestIds}
        isGeneratingPerturbations={isGeneratingPerturbations}
        onGeneratingChange={onGeneratingChange}
        onPerturbationsGenerated={onPerturbationsGenerated}
        onShowCriteriaColumn={onShowCriteriaColumn}
      />
      
      <TestManager
        currentTopic={currentTopic}
        isAddStatementsOpen={isAddStatementsOpen}
        onAddStatementsOpenChange={onAddStatementsOpenChange}
        isGenerateStatementsOpen={isGenerateStatementsOpen}
        onGenerateStatementsOpenChange={onGenerateStatementsOpenChange}
        onDataRefresh={onDataRefresh}
      />
    </div>
  )
}