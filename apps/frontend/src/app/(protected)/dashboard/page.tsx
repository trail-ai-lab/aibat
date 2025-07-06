"use client"

import { useMemo, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { AddTopicForm } from "@/components/add-topic-form"
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
    totalTests,
    currentTopic,
    handleTopicSelect,
    handleTopicCreated,
  } = useDashboard(selectedModel)

  const { perturbations, addPerturbations } = usePerturbations(currentTopic || undefined)

  const tableData = useMemo(
    () =>
      tests.map(test => ({
        id: test.id,
        statement: test.statement,
        ground_truth: test.ground_truth,
        your_assessment: test.your_assessment,
        ai_assessment: test.ai_assessment,
        agreement: test.agreement,
        topic: test.topic,
        labeler: test.labeler,
        description: test.description,
        author: test.author,
        model_score: test.model_score,
        is_builtin: test.is_builtin,
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
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <DashboardHeader
                topic={currentTopic}
                totalTests={totalTests}
                topicPrompt={topicPrompt}
              />

              <DashboardTable
                topic={currentTopic}
                loading={loading}
                error={error}
                data={tableData}
                onAssessmentChange={handleAssessmentChange}
                onDataRefresh={() => currentTopic && handleTopicSelect(currentTopic)}
                cachedPerturbations={perturbations}
                onPerturbationsUpdate={addPerturbations}
              />

              {!currentTopic && !loading && <DashboardEmpty />}
            </div>
          </div>
        </div>
      </SidebarInset>

      <Drawer open={isCreateTopicOpen} onOpenChange={setIsCreateTopicOpen}>
        <DrawerContent className="max-h-[90vh]">
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
