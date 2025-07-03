"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useTests } from "@/hooks/use-tests"
import { Badge } from "@/components/ui/badge"
import { IconLoader, IconDatabase } from "@tabler/icons-react"

export default function Page() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const { tests, loading, error, currentTopic, totalTests, fetchTests } = useTests()

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic)
    fetchTests(topic)
  }

  // Transform tests data to match the data table schema
  const tableData = tests.map(test => ({
    id: test.id,
    statement: test.statement,
    ground_truth: test.ground_truth,
    ai_assessment: test.ai_assessment,
    agreement: test.agreement,
    topic: test.topic,
    labeler: test.labeler,
    description: test.description,
    author: test.author,
    model_score: test.model_score,
  }))

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" onTopicSelect={handleTopicSelect} />
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
                <DataTable data={tableData} />
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
    </SidebarProvider>
  )
}
