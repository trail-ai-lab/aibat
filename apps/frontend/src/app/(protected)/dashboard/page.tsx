// apps/frontend/src/app/(protected)/dashboard/page.tsx

"use client"

import { useMemo, useState } from "react"
import { AppSidebar } from "@/components/sidebar-nav/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { AddTopicForm } from "@/components/sidebar-nav/add-topic-form"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { usePerturbations } from "@/hooks/use-perturbations"
import { updateTestAssessment } from "@/lib/api/tests"
import { toast } from "sonner"

import { useDashboard } from "@/hooks/use-dashboard"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardTable } from "@/components/dashboard/dashboard-table"
import { DashboardEmpty } from "@/components/dashboard/dashboard-empty"
import { z } from "zod"
import { schema } from "@/components/data-table/schema"

export default function Page() {
  const [isCreateTopicOpen, setIsCreateTopicOpen] = useState(false)

  const {
    selectedTopic,
    topicPrompt,
    topics,
    topicsLoading,
    tests,
    loading,
    error,
    currentTopic,
    handleTopicSelect,
    handleTopicCreated,
    handleTopicDelete,
    handleTopicEdit,
    refreshTests,
    updateTestAssessment: updateLocalTestAssessment,
    updateTestStatement,
    deleteTestsById,
  } = useDashboard()

  const { perturbations, addPerturbations } = usePerturbations(
    currentTopic || undefined
  )

  const tableData = useMemo(
    () =>
      tests.map((test) => {
        // Calculate agreement based on AI assessment vs user assessment
        const aiAssessment =
          test.label === "acceptable"
            ? "acceptable"
            : test.label === "unacceptable"
            ? "unacceptable"
            : null
        const userAssessment = test.ground_truth

        let agreement = null
        if (aiAssessment && userAssessment !== "ungraded") {
          agreement = aiAssessment === userAssessment
        }

        return {
          id: test.id,
          statement: test.title,
          ground_truth: test.ground_truth as
            | "acceptable"
            | "unacceptable"
            | "ungraded",
          ai_assessment:
            test.label === "acceptable"
              ? ("pass" as const)
              : test.label === "unacceptable"
              ? ("fail" as const)
              : test.label === "ungraded"
              ? ("grading" as const)
              : ("grading" as const),
          agreement,
          topic: test.topic,
          labeler: "ai_generated",
          description: "", // can update if available
          author: "",
          model_score: "",
          is_builtin: false,
          parent_id: undefined,
          criteria_text: undefined,
          perturbation_type: undefined,
        }
      }),
    [tests]
  )

  const handleAssessmentChange = async (
    testId: string,
    assessment: "acceptable" | "unacceptable"
  ) => {
    try {
      await updateTestAssessment(testId, assessment)

      // Update local state immediately to reflect the change in the specific cell
      updateLocalTestAssessment(testId, assessment)

      toast.success(`Assessment updated to ${assessment}`)
    } catch (error) {
      console.error("Error updating assessment:", error)
      toast.error("Failed to update assessment")
    }
  }

  const handleStatementUpdate = async (updatedItem: z.infer<typeof schema>) => {
    // Update the underlying test data
    updateTestStatement(updatedItem.id, {
      title: updatedItem.statement,
      ground_truth: updatedItem.ground_truth,
    })

    // If AI assessment is in grading state, refresh data after a delay to get updated assessment
    if (updatedItem.ai_assessment === "grading") {
      setTimeout(() => {
        refreshTests()
      }, 2000) // Wait 2 seconds for AI grading to complete
    }
  }

  const handleDeleteTest = async (testId: string) => {
    try {
      const result = await deleteTestsById([testId])
      if (result.success) {
        toast.success("Test deleted successfully")
      } else {
        toast.error(result.error || "Failed to delete test")
      }
    } catch (error) {
      console.error("Error deleting test:", error)
      toast.error("Failed to delete test")
    }
  }

  const handleBulkDeleteTests = async (testIds: string[]) => {
    try {
      const result = await deleteTestsById(testIds)
      if (result.success) {
        toast.success(
          `${testIds.length} test${
            testIds.length === 1 ? "" : "s"
          } deleted successfully`
        )
      } else {
        toast.error(result.error || "Failed to delete tests")
      }
    } catch (error) {
      console.error("Error deleting tests:", error)
      toast.error("Failed to delete tests")
    }
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        variant="inset"
        onTopicSelect={handleTopicSelect}
        onCreateTopic={() => setIsCreateTopicOpen(true)}
        selectedTopic={selectedTopic}
        topics={topics}
        loading={topicsLoading}
        onDeleteTopic={handleTopicDelete}
        onEditTopic={handleTopicEdit}
      />
      <SidebarInset>
        <SiteHeader
          topicName={currentTopic ?? undefined}
          testsCount={tests.length}
        />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <DashboardTable
                topic={currentTopic}
                loading={loading}
                error={error}
                data={tableData}
                onAssessmentChange={handleAssessmentChange}
                onDataRefresh={refreshTests}
                cachedPerturbations={perturbations}
                onPerturbationsUpdate={addPerturbations}
                onStatementUpdate={handleStatementUpdate}
                onDeleteTest={handleDeleteTest}
                onBulkDeleteTests={handleBulkDeleteTests}
              />
              <DashboardHeader
                topic={currentTopic}
                totalTests={tests.length}
                topicPrompt={topicPrompt}
              />

              {!currentTopic && !loading && <DashboardEmpty />}
            </div>
          </div>
        </div>
      </SidebarInset>

      <Drawer open={isCreateTopicOpen} onOpenChange={setIsCreateTopicOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Create New Topic</DrawerTitle>
            <DrawerDescription>
              Create new topic for assessment.
            </DrawerDescription>
          </DrawerHeader>
          <AddTopicForm
            onClose={() => setIsCreateTopicOpen(false)}
            onSuccess={handleTopicCreated}
          />
        </DrawerContent>
      </Drawer>
    </SidebarProvider>
  )
}
