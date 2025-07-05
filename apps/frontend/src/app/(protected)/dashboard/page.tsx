"use client"

import { useState, useEffect, useRef } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SiteHeader } from "@/components/site-header"
import { AddTopicForm } from "@/components/add-topic-form"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useTests } from "@/hooks/use-tests"
import { useTopics } from "@/hooks/use-topics"
import { useModels } from "@/hooks/use-models"
import { usePerturbations } from "@/hooks/use-perturbations"
import { Badge } from "@/components/ui/badge"
import { IconLoader, IconDatabase } from "@tabler/icons-react"
import { fetchTopicPrompt } from "@/lib/api/topics"
import { updateTestAssessment } from "@/lib/api/tests"
import { toast } from "sonner"

export default function Page() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [isCreateTopicOpen, setIsCreateTopicOpen] = useState(false)
  const [topicPrompt, setTopicPrompt] = useState<string | null>(null)
  const [promptLoading, setPromptLoading] = useState(false)
  const [pendingTopicSelection, setPendingTopicSelection] = useState<string | null>(null)
  const { selectedModel } = useModels()
  const { tests, loading, error, currentTopic, totalTests, fetchTests } = useTests(undefined, selectedModel)
  const { topics, refreshTopics } = useTopics()
  const { perturbations, loading: perturbationsLoading, addPerturbations } = usePerturbations(currentTopic || undefined)

  // Auto-select newly created topic when topics list updates
  useEffect(() => {
    if (pendingTopicSelection && topics.some(topic => topic.name === pendingTopicSelection)) {
      handleTopicSelect(pendingTopicSelection)
      setPendingTopicSelection(null)
    }
  }, [topics, pendingTopicSelection])

  const handleTopicSelect = async (topic: string) => {
    setSelectedTopic(topic)
    fetchTests(topic)
    
    // Fetch topic prompt
    setPromptLoading(true)
    try {
      const prompt = await fetchTopicPrompt(topic)
      setTopicPrompt(prompt)
    } catch (error) {
      console.error("Error fetching topic prompt:", error)
      setTopicPrompt(null)
    } finally {
      setPromptLoading(false)
    }
  }

  const handleCreateTopic = () => {
    setIsCreateTopicOpen(true)
  }

  const handleTopicCreated = async (topicName: string) => {
    setPendingTopicSelection(topicName) // Mark topic for auto-selection
    await refreshTopics() // Refresh the topics list
  }

  // Transform tests data to match the data table schema
  const tableData = tests.map(test => ({
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
  }))

  const handleAssessmentChange = async (testId: string, assessment: "acceptable" | "unacceptable") => {
    try {
      // Update the assessment via API
      await updateTestAssessment(testId, assessment)
      
      // Show success message
      toast.success(`Assessment updated to ${assessment}`)
      
      // Refresh the tests to show the change
      if (currentTopic) {
        await fetchTests(currentTopic)
      }
    } catch (error) {
      console.error("Error updating assessment:", error)
      toast.error("Failed to update assessment")
    }
  }

  const handleDataRefresh = async () => {
    // Refresh the tests data after adding new statements
    if (currentTopic) {
      await fetchTests(currentTopic)
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
        onCreateTopic={handleCreateTopic}
        selectedTopic={currentTopic}
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Topic Header */}
              <div className="flex items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-3">
                  <IconDatabase className="size-6" />
                  <div>
                    <h1 className="text-2xl font-semibold">
                      {currentTopic ? `${currentTopic} Tests` : "Select a Topic"}
                    </h1>
                    <p className="text-muted-foreground">
                      {currentTopic
                        ? `Showing ${totalTests} test statements for ${currentTopic}`
                        : "Choose a topic from the sidebar to view test statements"
                      }
                    </p>
                    {/* Topic Prompt */}
                    {currentTopic && (
                      <div className="mt-3">
                        {promptLoading ? (
                          <div className="flex items-center gap-2">
                            <IconLoader className="size-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Loading prompt...</span>
                          </div>
                        ) : topicPrompt ? (
                          <div className="bg-muted/50 rounded-lg p-3 border-l-4 border-primary">
                            <p className="text-sm font-medium text-foreground mb-1">Topic Prompt:</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">{topicPrompt}</p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
                {currentTopic && (
                  <Badge variant="secondary" className="px-3 py-1">
                    {totalTests} tests
                  </Badge>
                )}
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <IconLoader className="size-6 animate-spin mr-2" />
                  <span>Loading tests...</span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <p className="text-red-600 mb-2">Error loading tests</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
              )}

              {/* Data Table */}
              {!loading && !error && tableData.length > 0 && (
                <DataTable
                  data={tableData}
                  onAssessmentChange={handleAssessmentChange}
                  currentTopic={currentTopic || undefined}
                  onDataRefresh={handleDataRefresh}
                  cachedPerturbations={perturbations}
                  onPerturbationsUpdate={addPerturbations}
                />
              )}

              {/* Empty State */}
              {!loading && !error && tableData.length === 0 && currentTopic && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <IconDatabase className="size-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">No tests found</p>
                    <p className="text-sm text-muted-foreground">
                      No test statements available for topic "{currentTopic}"
                    </p>
                  </div>
                </div>
              )}

              {/* Initial State */}
              {!currentTopic && !loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <IconDatabase className="size-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-xl font-medium mb-2">Welcome to AIBAT</p>
                    <p className="text-muted-foreground">
                      Select a topic from the sidebar to view test statements and assessments
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Create Topic Drawer */}
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
