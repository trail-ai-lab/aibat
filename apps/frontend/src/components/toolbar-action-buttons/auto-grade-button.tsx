"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { IconRobot, IconLoader } from "@tabler/icons-react"
import { autoGradeTests } from "@/lib/api/tests"
import { toast } from "sonner"

interface AutoGradeButtonProps {
  selectedRowsCount: number
  selectedTestIds: string[]
  onGradingStart?: () => void
  onGradingComplete?: () => void
  onDataRefresh?: () => void
  onUpdateTestsGradingState?: (testIds: string[], isGrading: boolean) => void
  disabled?: boolean
}

export function AutoGradeButton({
  selectedRowsCount,
  selectedTestIds,
  onGradingStart,
  onGradingComplete,
  onDataRefresh,
  onUpdateTestsGradingState,
  disabled = false
}: AutoGradeButtonProps) {
  const [isGrading, setIsGrading] = React.useState(false)

  const handleAutoGrade = async () => {
    if (selectedTestIds.length === 0) {
      toast.error("Please select tests to grade")
      return
    }

    try {
      setIsGrading(true)
      onGradingStart?.()
      
      // Set the selected tests to "grading" state immediately
      onUpdateTestsGradingState?.(selectedTestIds, true)
      
      const response = await autoGradeTests(selectedTestIds)
      
      toast.success(`Successfully graded ${response.graded_count} test${response.graded_count !== 1 ? 's' : ''}`)
      
      // Refresh the data to show updated grades
      onDataRefresh?.()
      
    } catch (error) {
      console.error("Error auto grading tests:", error)
      toast.error(error instanceof Error ? error.message : "Failed to auto grade tests")
      
      // Reset grading state on error
      onUpdateTestsGradingState?.(selectedTestIds, false)
    } finally {
      setIsGrading(false)
      onGradingComplete?.()
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAutoGrade}
      disabled={disabled || isGrading || selectedRowsCount === 0}
      className="gap-2"
    >
      {isGrading ? (
        <IconLoader className="h-4 w-4 animate-spin" />
      ) : (
        <IconRobot className="h-4 w-4" />
      )}
      {isGrading ? "Grading..." : `Auto Grade${selectedRowsCount > 0 ? ` (${selectedRowsCount})` : ""}`}
    </Button>
  )
}