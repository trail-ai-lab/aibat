// src/components/data-table/columns.tsx
import { z } from "zod"
import { schema } from "./schema"
import { DragHandle } from "./drag-handle"
import { TableCellViewer } from "./table-cell-viewer"
import { EditStatementDrawer } from "./edit-statement-drawer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  IconLoader,
  IconCheck,
  IconX,
  IconCircleCheckFilled,
  IconChevronDown,
  IconChevronUp,
  IconDotsVertical,
} from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ColumnDef } from "@tanstack/react-table"

export const createColumns = (
  onAssessmentChange?: (
    id: string,
    assessment: "acceptable" | "unacceptable"
  ) => void,
  onStatementUpdate?: (updatedItem: z.infer<typeof schema>) => void,
  onDeleteTest?: (testId: string) => void,
  showCriteriaColumn: boolean = false
): ColumnDef<z.infer<typeof schema>>[] => {
  const baseColumns: ColumnDef<z.infer<typeof schema>>[] = [
    {
      id: "drag",
      header: () => null,
      cell: ({ row }) => {
        const isChildRow = !!row.original.parent_id
        return isChildRow ? null : <DragHandle id={row.original.id} />
      },
    },
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => {
        const isChildRow = !!row.original.parent_id
        return isChildRow ? null : (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "statement",
      header: "Statements",
      cell: ({ row }) => {
        const isChildRow = !!row.original.parent_id
        if (isChildRow) {
          return (
            <div className="pl-4 text-sm text-muted-foreground max-w-lg break-words whitespace-normal">
              {row.original.statement}
            </div>
          )
        }
        return (
          <div className="min-w-[240px] max-w-lg">
            <TableCellViewer item={row.original} onUpdate={onStatementUpdate} />
          </div>
        )
      },
      enableHiding: false,
      size: 500, // Increased width for the column
    },
    ...(showCriteriaColumn
      ? [
          {
            accessorKey: "criteria",
            header: () => <div className="text-center w-full">Criteria</div>,
            cell: ({ row, table }: { row: any; table: any }) => {
              const isChildRow = !!row.original.parent_id
              const expandedRows =
                ((table.options.meta as Record<string, unknown>)
                  ?.expandedRows as Set<string>) || new Set()
              const isExpanded = expandedRows.has(row.original.id)
              const toggleExpanded = (
                table.options.meta as Record<string, unknown>
              )?.toggleExpanded as ((id: string) => void) | undefined

              if (isChildRow) {
                return (
                  <div className="pl-4">
                    <Badge variant="outline" className="text-xs">
                      {row.original.perturbation_type ||
                        row.original.criteria_text ||
                        "Perturbation"}
                    </Badge>
                  </div>
                )
              }

              // Only show expand button if this row has perturbations
              const hasChildRows = (
                table.options.meta as Record<string, unknown>
              )?.perturbations as Map<string, unknown> | undefined
              const hasChildRowsForThisRow =
                hasChildRows?.has(row.original.id) || false

              if (!hasChildRowsForThisRow) {
                return null
              }

              return (
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => toggleExpanded?.(row.original.id)}
                  >
                    {isExpanded ? (
                      <IconChevronUp className="h-4 w-4" />
                    ) : (
                      <IconChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )
            },
          },
        ]
      : []),
    {
      accessorKey: "ai_assessment",
      header: "AI Assessment",
      cell: ({ row }) => {
        const assessment = row.original.ai_assessment

        if (assessment === "grading") {
          return (
            <div className="w-32">
              <Badge
                variant="outline"
                className="px-1.5 text-blue-600 border-blue-200"
              >
                <IconLoader className="animate-spin mr-1 h-3 w-3" />
                Grading
              </Badge>
            </div>
          )
        }

        return (
          <div className="w-32">
            <Badge
              variant="outline"
              className={`px-1.5 ${
                assessment === "pass"
                  ? "text-green-600"
                  : assessment === "fail"
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {assessment === "pass"
                ? "Acceptable"
                : assessment === "fail"
                ? "Unacceptable"
                : "Ungraded"}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: "ground_truth",
      header: "Your Assessment",
      sortingFn: (rowA, rowB) => {
        const order = { ungraded: 0, unacceptable: 1, acceptable: 2 }
        const a = rowA.original.ground_truth
        const b = rowB.original.ground_truth
        return order[a] - order[b]
      },
      cell: ({ row, table }) => {
        const isChildRow = !!row.original.parent_id
        const assessment = row.original.ground_truth
        const testId = row.original.id

        // For child rows (perturbations), check parent assessment status
        if (isChildRow) {
          const parentId = row.original.parent_id
          const allRows = (table.options.data as z.infer<typeof schema>[]) || []
          const parentRow = allRows.find(
            (r) => r.id === parentId && !r.parent_id
          )

          // If parent is ungraded, show perturbation as ungraded
          if (parentRow?.ground_truth === "ungraded") {
            return (
              <Badge
                variant="outline"
                className="px-1.5 text-gray-600 border-gray-200"
              >
                Ungraded
              </Badge>
            )
          }

          // If parent is graded, show perturbation's ground_truth value
          const groundTruth = row.original.ground_truth
          const badgeClass =
            groundTruth === "acceptable"
              ? "px-1.5 text-green-600"
              : "px-1.5 text-red-600"
          const displayText =
            groundTruth === "acceptable" ? "Acceptable" : "Unacceptable"

          return (
            <Badge variant="outline" className={badgeClass}>
              {displayText}
            </Badge>
          )
        }

        // For parent rows, use existing logic
        if (assessment === "ungraded") {
          return (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-1.5">
                Ungraded
              </Badge>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-green-50 text-green-600"
                  onClick={() => onAssessmentChange?.(testId, "acceptable")}
                  title="Mark as Acceptable"
                >
                  <IconCheck className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-red-50 text-red-600"
                  onClick={() => onAssessmentChange?.(testId, "unacceptable")}
                  title="Mark as Unacceptable"
                >
                  <IconX className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        }

        // For graded parent items, show the regular badge
        const badgeClass =
          assessment === "acceptable"
            ? "px-1.5 text-green-600"
            : "px-1.5 text-red-600"
        const displayText =
          assessment === "acceptable" ? "Acceptable" : "Unacceptable"

        return (
          <Badge variant="outline" className={badgeClass}>
            {displayText}
          </Badge>
        )
      },
    },
    {
      accessorKey: "agreement",
      header: "Agreement",
      cell: ({ row, table }) => {
        const isChildRow = !!row.original.parent_id
        const agreement = row.original.agreement
        const aiAssessment = row.original.ai_assessment
        const yourAssessment = row.original.ground_truth

        // For child rows (perturbations), handle agreement calculation differently
        if (isChildRow) {
          const parentId = row.original.parent_id
          const allRows = (table.options.data as z.infer<typeof schema>[]) || []
          const parentRow = allRows.find(
            (r) => r.id === parentId && !r.parent_id
          )

          // If parent is ungraded or AI is still grading, show pending
          if (
            parentRow?.ground_truth === "ungraded" ||
            aiAssessment === "grading"
          ) {
            return (
              <Badge variant="outline" className="px-1.5">
                <IconLoader className="mr-1 h-3 w-3" />
                Pending
              </Badge>
            )
          }

          // For perturbations, compare AI assessment with ground_truth (which is shown as Your Assessment)
          const groundTruth = row.original.ground_truth
          const aiResult =
            aiAssessment === "pass" ? "acceptable" : "unacceptable"
          const isMatch = aiResult === groundTruth

          return (
            <Badge
              variant="outline"
              className={`px-1.5 ${
                isMatch ? "text-green-600" : "text-red-600"
              }`}
            >
              {isMatch ? (
                <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1" />
              ) : (
                <IconX className="mr-1 h-3 w-3" />
              )}
              {isMatch ? "Match" : "Mismatch"}
            </Badge>
          )
        }

        // For parent rows, use existing logic
        // If AI is still grading or user hasn't assessed, show pending
        if (
          aiAssessment === "grading" ||
          yourAssessment === "ungraded" ||
          agreement === null
        ) {
          return (
            <Badge variant="outline" className="px-1.5">
              <IconLoader className="mr-1 h-3 w-3" />
              Pending
            </Badge>
          )
        }

        return (
          <Badge
            variant="outline"
            className={`px-1.5 ${
              agreement ? "text-green-600" : "text-red-600"
            }`}
          >
            {agreement ? (
              <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1" />
            ) : (
              <IconX className="mr-1 h-3 w-3" />
            )}
            {agreement ? "Match" : "Mismatch"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const isChildRow = !!row.original.parent_id
        return isChildRow ? null : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                size="icon"
              >
                <IconDotsVertical />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <EditStatementDrawer
                item={row.original}
                onUpdate={onStatementUpdate}
              >
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Edit
                </DropdownMenuItem>
              </EditStatementDrawer>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDeleteTest?.(row.original.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return baseColumns
}
