"use client"

import * as React from "react"
import { AnalyzeAIBehaviorButton } from "@/components/toolbar-action-buttons/analyze-ai-behavior-button"
import { CriteriaButton } from "@/components/toolbar-action-buttons/criteria-button"
import { AddStatementsButton } from "@/components/toolbar-action-buttons/add-statements-button"
import { GenerateStatementsButton } from "@/components/toolbar-action-buttons/generate-statements-button"
import { type PerturbationResponse } from "@/types/perturbations"

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
      <CriteriaButton
        currentTopic={currentTopic}
        isOpen={isCriteriaEditorOpen}
        onOpenChange={onCriteriaEditorOpenChange}
      />

      <AnalyzeAIBehaviorButton
        currentTopic={currentTopic}
        selectedRowsCount={selectedRowsCount}
        selectedTestIds={selectedTestIds}
        isGeneratingPerturbations={isGeneratingPerturbations}
        onGeneratingChange={onGeneratingChange}
        onPerturbationsGenerated={onPerturbationsGenerated}
        onShowCriteriaColumn={onShowCriteriaColumn}
      />

      <AddStatementsButton
        currentTopic={currentTopic}
        isOpen={isAddStatementsOpen}
        onOpenChange={onAddStatementsOpenChange}
        onSuccess={onDataRefresh || (() => {})}
      />

      <GenerateStatementsButton
        currentTopic={currentTopic}
        isOpen={isGenerateStatementsOpen}
        onOpenChange={onGenerateStatementsOpenChange}
        onSuccess={onDataRefresh || (() => {})}
      />
    </div>
  )
}
