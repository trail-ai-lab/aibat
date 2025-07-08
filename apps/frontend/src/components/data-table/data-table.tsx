// apps/frontend/src/components/data-table/data-table.tsx
"use client"

import * as React from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  flexRender,
  type VisibilityState,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  IconChevronsLeft,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsRight,
} from "@tabler/icons-react"

import { TableActionsToolbar } from "@/components/toolbar-action-buttons/table-actions-toolbar"
import { ChartPieLabel } from "@/components/evaluations/char-pie-label"
import { ChartTooltipDefault } from "@/components/evaluations/chart-tooltip-default"

import { PerturbationResponse } from "@/types/perturbations"
import { z } from "zod"
import { schema } from "./schema"
import { createColumns } from "./columns"
import { useExpandedRows } from "./use-expanded-rows"
import { TableBodyWrapper } from "./table-body-wrapper"
import { ChartRadarDots } from "../evaluations/chart-radar-dots"

export function DataTable({
  data: initialData,
  onAssessmentChange,
  currentTopic,
  onDataRefresh,
  cachedPerturbations,
  onPerturbationsUpdate,
}: {
  data: z.infer<typeof schema>[]
  onAssessmentChange?: (
    id: string,
    assessment: "acceptable" | "unacceptable"
  ) => void
  currentTopic?: string
  onDataRefresh?: () => void
  cachedPerturbations?: Map<string, PerturbationResponse[]>
  onPerturbationsUpdate?: (
    newPerturbations: Map<string, PerturbationResponse[]>
  ) => void
}) {
  const [data, setData] = React.useState(() => initialData)

  // Update local data when initialData changes (e.g., after generating new statements)
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const [isAddStatementsOpen, setIsAddStatementsOpen] = React.useState(false)
  const [isGenerateStatementsOpen, setIsGenerateStatementsOpen] =
    React.useState(false)
  const [isCriteriaEditorOpen, setIsCriteriaEditorOpen] = React.useState(false)
  const [isGeneratingPerturbations, setIsGeneratingPerturbations] =
    React.useState(false)

  const [perturbations, setPerturbations] = React.useState<
    Map<string, PerturbationResponse[]>
  >(new Map())

  const { expandedRows, toggleExpanded, generateChildRows } =
    useExpandedRows(perturbations)

  React.useEffect(() => {
    if (cachedPerturbations) {
      setPerturbations(cachedPerturbations)
      if (cachedPerturbations.size > 0) {
        setColumnVisibility((prev) => ({ ...prev, criteria: true }))
      }
    }
  }, [cachedPerturbations])

  const columns = React.useMemo(
    () => createColumns(onAssessmentChange),
    [onAssessmentChange]
  )

  const parentTable = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    meta: { expandedRows, toggleExpanded },
  })

  const paginatedExpandedData = React.useMemo(() => {
    const rows: z.infer<typeof schema>[] = []
    for (const row of parentTable.getRowModel().rows) {
      rows.push(row.original)
      if (
        expandedRows.has(row.original.id) &&
        perturbations.has(row.original.id)
      ) {
        rows.push(...generateChildRows(row.original))
      }
    }
    return rows
  }, [
    parentTable.getRowModel().rows,
    expandedRows,
    perturbations,
    generateChildRows,
  ])

  const table = useReactTable({
    data: paginatedExpandedData,
    columns,
    state: {
      sorting: parentTable.getState().sorting,
      columnVisibility: parentTable.getState().columnVisibility,
      rowSelection: parentTable.getState().rowSelection,
      columnFilters: parentTable.getState().columnFilters,
      pagination: { pageIndex: 0, pageSize: paginatedExpandedData.length },
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: parentTable.setRowSelection,
    onSortingChange: parentTable.setSorting,
    onColumnFiltersChange: parentTable.setColumnFilters,
    onColumnVisibilityChange: parentTable.setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    meta: { expandedRows, toggleExpanded, perturbations },
  })

  return (
    <Tabs defaultValue="outline" className="w-full flex-col gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="outline">
          <SelectTrigger
            className="w-fit @4xl/main:hidden"
            id="view-selector"
            size="sm"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="evaluations">Evaluations</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="@4xl/main:flex hidden">
          <TabsTrigger value="outline">Assessments</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
        </TabsList>
        <TableActionsToolbar
          currentTopic={currentTopic}
          selectedRowsCount={
            parentTable.getFilteredSelectedRowModel().rows.length
          }
          selectedTestIds={parentTable
            .getFilteredSelectedRowModel()
            .rows.map((r) => r.original.id)}
          isGeneratingPerturbations={isGeneratingPerturbations}
          onGeneratingChange={setIsGeneratingPerturbations}
          onPerturbationsGenerated={(newPerturbations) => {
            setPerturbations((prev) => {
              const updated = new Map(prev)
              for (const [id, perturbs] of newPerturbations) {
                updated.set(id, perturbs)
              }
              return updated
            })
            onPerturbationsUpdate?.(newPerturbations)
          }}
          onShowCriteriaColumn={() =>
            setColumnVisibility((prev) => ({ ...prev, criteria: true }))
          }
          isCriteriaEditorOpen={isCriteriaEditorOpen}
          onCriteriaEditorOpenChange={setIsCriteriaEditorOpen}
          isAddStatementsOpen={isAddStatementsOpen}
          onAddStatementsOpenChange={setIsAddStatementsOpen}
          isGenerateStatementsOpen={isGenerateStatementsOpen}
          onGenerateStatementsOpenChange={setIsGenerateStatementsOpen}
          onDataRefresh={onDataRefresh}
        />
      </div>

      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <TableBodyWrapper
            table={table}
            data={paginatedExpandedData}
            setData={setData}
          />
        </div>

        <div className="flex items-center justify-between px-4">
          <div className="hidden text-sm text-muted-foreground lg:flex">
            {parentTable.getFilteredSelectedRowModel().rows.length} of{" "}
            {parentTable.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden lg:flex items-center gap-2">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${parentTable.getState().pagination.pageSize}`}
                onValueChange={(value) =>
                  parentTable.setPageSize(Number(value))
                }
              >
                <SelectTrigger className="w-20" id="rows-per-page" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm font-medium">
              Page {parentTable.getState().pagination.pageIndex + 1} of{" "}
              {parentTable.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                onClick={() => parentTable.setPageIndex(0)}
                disabled={!parentTable.getCanPreviousPage()}
                size="icon"
                variant="outline"
                className="hidden h-8 w-8 lg:flex"
              >
                <IconChevronsLeft />
              </Button>
              <Button
                onClick={() => parentTable.previousPage()}
                disabled={!parentTable.getCanPreviousPage()}
                size="icon"
                variant="outline"
              >
                <IconChevronLeft />
              </Button>
              <Button
                onClick={() => parentTable.nextPage()}
                disabled={!parentTable.getCanNextPage()}
                size="icon"
                variant="outline"
              >
                <IconChevronRight />
              </Button>
              <Button
                onClick={() =>
                  parentTable.setPageIndex(parentTable.getPageCount() - 1)
                }
                disabled={!parentTable.getCanNextPage()}
                size="icon"
                variant="outline"
                className="hidden h-8 w-8 lg:flex"
              >
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="evaluations" className="flex flex-col px-4 lg:px-6">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <ChartPieLabel data={data} topic={currentTopic} />
          <ChartTooltipDefault data={data} topic={currentTopic} />
          <ChartRadarDots />
        </div>
      </TabsContent>
    </Tabs>
  )
}
