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
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useModels } from "@/hooks/use-models"
import { usePerturbations } from "@/hooks/use-perturbations"
import { updateTestAssessment } from "@/lib/api/tests"
import { toast } from "sonner"

import { useDashboard } from "@/hooks/use-dashboard"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardTable } from "@/components/dashboard/dashboard-table"
import { DashboardEmpty } from "@/components/dashboard/dashboard-empty"

export default function Page() {
  const { selectedModel } = useModels()
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
  } = useDashboard(selectedModel)

  const { perturbations, addPerturbations } = usePerturbations(currentTopic || undefined)

  const tableData = useMemo(
  () =>
    tests
      .map(test => ({
        id: test.id,
        statement: test.title,
        ground_truth: test.ground_truth as "acceptable" | "unacceptable" | "ungraded",
        ai_assessment: test.label === "acceptable" ? "pass" as const :
                       test.label === "unacceptable" ? "fail" as const :
                       test.label === "ungraded" ? "grading" as const :
                       "grading" as const,
        agreement: test.validity === "approved" ? true :
                   test.validity === "denied" ? false :
                   null, // No agreement calculated yet
        topic: test.topic,
        labeler: "ai_generated",
        description: "", // can update if available
        author: "",
        model_score: "",
        is_builtin: false,
        parent_id: undefined,
        criteria_text: undefined,
        perturbation_type: undefined
      })),
  [tests]
)

  const handleAssessmentChange = async (testId: string, assessment: "acceptable" | "unacceptable") => {
    try {
      await updateTestAssessment(testId, assessment)
      toast.success(`Assessment updated to ${assessment}`)
    } catch (error) {
      console.error("Error updating assessment:", error)
      toast.error("Failed to update assessment")
    }
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
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
        <SiteHeader topicName={currentTopic ?? undefined} testsCount={tests.length} />
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
