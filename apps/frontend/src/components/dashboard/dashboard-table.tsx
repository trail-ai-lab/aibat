// components/dashboard/dashboard-table.tsx
import { IconDatabase } from "@tabler/icons-react"
import { DataTable } from "@/components/data-table/data-table"
import { PerturbationResponse } from "@/types/perturbations"
import { z } from "zod"
import { schema } from "../data-table/schema"
import { Skeleton } from "../ui/skeleton"

interface Props {
  topic: string | null
  loading: boolean
  error: string | null
  data: z.infer<typeof schema>[]
  onAssessmentChange: (
    testId: string,
    value: "acceptable" | "unacceptable"
  ) => void
  onDataRefresh: () => void
  cachedPerturbations: Map<string, PerturbationResponse[]>
  onPerturbationsUpdate: (
    newPerturbations: Map<string, PerturbationResponse[]>
  ) => void
  onStatementUpdate?: (updatedItem: z.infer<typeof schema>) => void
  onDeleteTest?: (testId: string) => void
  onBulkDeleteTests?: (testIds: string[]) => Promise<void>
}

export function DashboardTable({
  topic,
  loading,
  error,
  data,
  onAssessmentChange,
  onDataRefresh,
  cachedPerturbations,
  onPerturbationsUpdate,
  onStatementUpdate,
  onDeleteTest,
  onBulkDeleteTests,
}: Props) {
  if (loading) {
    return (
      <div className="space-y-4 py-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-[40%]" />
            <Skeleton className="h-4 w-[20%]" />
            <Skeleton className="h-4 w-[15%]" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading tests</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!topic) return null

  return (
    <DataTable
      data={data}
      onAssessmentChange={onAssessmentChange}
      currentTopic={topic}
      onDataRefresh={onDataRefresh}
      cachedPerturbations={cachedPerturbations}
      onPerturbationsUpdate={onPerturbationsUpdate}
      onStatementUpdate={onStatementUpdate}
      onDeleteTest={onDeleteTest}
      onBulkDeleteTests={onBulkDeleteTests}
    />
  )
}
