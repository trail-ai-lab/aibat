"use client"

import * as React from "react"
import { AnalyzeAIBehaviorButton } from "@/components/toolbar-action-buttons/analyze-ai-behavior-button"
import { CriteriaButton } from "@/components/toolbar-action-buttons/criteria-button"
import { AddStatementsButton } from "@/components/toolbar-action-buttons/add-statements-button"
import { GenerateStatementsButton } from "@/components/toolbar-action-buttons/generate-statements-drawer"
import { type PerturbationResponse } from "@/types/perturbations"
import { useToolbarCollapse } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { IconDots } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const shouldCollapse = useToolbarCollapse()

  // Keep first two buttons (Generate Statements and Analyze AI Behavior) visible, collapse others into dropdown
  if (shouldCollapse) {
    return (
      <div className="flex items-center gap-2">
        <GenerateStatementsButton
          currentTopic={currentTopic}
          isOpen={isGenerateStatementsOpen}
          onOpenChange={onGenerateStatementsOpenChange}
          onSuccess={onDataRefresh || (() => {})}
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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" title="More actions">
              <IconDots />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex flex-col gap-1 p-1">
              <CriteriaButton
                currentTopic={currentTopic}
                isOpen={isCriteriaEditorOpen}
                onOpenChange={onCriteriaEditorOpenChange}
                inDropdown={true}
              />
              <AddStatementsButton
                currentTopic={currentTopic}
                isOpen={isAddStatementsOpen}
                onOpenChange={onAddStatementsOpenChange}
                onSuccess={onDataRefresh || (() => {})}
                inDropdown={true}
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  // Full toolbar for larger screens - reordered as requested
  return (
    <div className="flex items-center gap-2">
      <GenerateStatementsButton
        currentTopic={currentTopic}
        isOpen={isGenerateStatementsOpen}
        onOpenChange={onGenerateStatementsOpenChange}
        onSuccess={onDataRefresh || (() => {})}
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

      <CriteriaButton
        currentTopic={currentTopic}
        isOpen={isCriteriaEditorOpen}
        onOpenChange={onCriteriaEditorOpenChange}
      />

      <AddStatementsButton
        currentTopic={currentTopic}
        isOpen={isAddStatementsOpen}
        onOpenChange={onAddStatementsOpenChange}
        onSuccess={onDataRefresh || (() => {})}
      />
    </div>
  )
}
