"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
  IconCheck,
  IconX,
} from "@tabler/icons-react"
import { ModelSelector } from "@/components/model-selector"
import { ChartPieLabel } from "@/components/char-area-interactive"
import { ChartTooltipDefault } from "@/components/chart-tooltip-default"
import { AddStatementsForm } from "@/components/add-statements-form"


import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export const schema = z.object({
  id: z.string(),
  statement: z.string(),
  ground_truth: z.enum(["acceptable", "unacceptable"]),
  your_assessment: z.enum(["ungraded", "acceptable", "unacceptable"]),
  ai_assessment: z.enum(["pass", "fail", "grading"]),
  agreement: z.boolean().nullable(),
  topic: z.string(),
  labeler: z.string().optional(),
  description: z.string().optional(),
  author: z.string().optional(),
  model_score: z.string().optional(),
  is_builtin: z.boolean().optional(),
})

// Create a separate component for the drag handle
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

const createColumns = (onAssessmentChange?: (id: string, assessment: "acceptable" | "unacceptable") => void): ColumnDef<z.infer<typeof schema>>[] => [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
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
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "statement",
    header: "Statements",
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />
    },
    enableHiding: false,
  },
  {
    accessorKey: "ai_assessment",
    header: "AI Assessment",
    cell: ({ row }) => {
      const assessment = row.original.ai_assessment;
      
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
        );
      }
      
      return (
        <div className="w-32">
          <Badge
            variant="outline"
            className={`px-1.5 ${
              assessment === "pass"
                ? "text-green-600 border-green-200"
                : "text-red-600 border-red-200"
            }`}
          >
            {assessment === "pass" ? "Acceptable" : "Unacceptable"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "your_assessment",
    header: "Your Assessment",
    cell: ({ row }) => {
      const assessment = row.original.your_assessment;
      const testId = row.original.id;
      
      if (assessment === "ungraded") {
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-1.5 text-gray-600 border-gray-200">
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
        );
      }
      
      // For graded items, show the regular badge
      const badgeClass = assessment === "acceptable"
        ? "px-1.5 text-green-600 border-green-200"
        : "px-1.5 text-red-600 border-red-200";
      const displayText = assessment === "acceptable" ? "Acceptable" : "Unacceptable";
      
      return (
        <Badge variant="outline" className={badgeClass}>
          {displayText}
        </Badge>
      );
    },
  },
  {
    accessorKey: "agreement",
    header: "Agreement",
    cell: ({ row }) => {
      const agreement = row.original.agreement;
      const aiAssessment = row.original.ai_assessment;
      const yourAssessment = row.original.your_assessment;
      
      // If AI is still grading or user hasn't assessed, show pending
      if (aiAssessment === "grading" || yourAssessment === "ungraded" || agreement === null) {
        return (
          <Badge
            variant="outline"
            className="px-1.5 text-gray-600 border-gray-200"
          >
            <IconLoader className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      }
      
      return (
        <Badge
          variant="outline"
          className={`px-1.5 ${
            agreement
              ? "text-green-600 border-green-200"
              : "text-orange-600 border-orange-200"
          }`}
        >
          {agreement ? (
            <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1" />
          ) : (
            <IconX className="mr-1 h-3 w-3" />
          )}
          {agreement ? "Match" : "Mismatch"}
        </Badge>
      );
    },
  },
    {
    id: "actions",
    cell: () => (
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
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Make a copy</DropdownMenuItem>
          <DropdownMenuItem>Favorite</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
        height: 'auto',
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function DataTable({
  data: initialData,
  onAssessmentChange,
  currentTopic,
  onDataRefresh,
}: {
  data: z.infer<typeof schema>[]
  onAssessmentChange?: (id: string, assessment: "acceptable" | "unacceptable") => void
  currentTopic?: string
  onDataRefresh?: () => void
}) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [isAddStatementsOpen, setIsAddStatementsOpen] = React.useState(false)
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const columns = React.useMemo(() => createColumns(onAssessmentChange), [onAssessmentChange])

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  const table = useReactTable({
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
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  const handleAddStatementsSuccess = () => {
    // Refresh the data after successfully adding statements
    onDataRefresh?.()
  }


  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="outline">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="evaluations">Evaluations</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="outline">Assessments</TabsTrigger>
          <TabsTrigger value="evaluations">
            Evaluations
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <ModelSelector currentTopic={currentTopic} />
          <Drawer
            direction="bottom"
            open={isAddStatementsOpen}
            onOpenChange={setIsAddStatementsOpen}
          >
            <DrawerTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!currentTopic}
                title={!currentTopic ? "Select a topic to add statements" : "Add statements to this topic"}
              >
                <IconPlus />
                <span className="hidden lg:inline">Add Statements</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader className="gap-1">
                <DrawerTitle>Add Statements</DrawerTitle>
                <DrawerDescription>
                  Add new test statements to the current topic
                </DrawerDescription>
              </DrawerHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-4">
                {currentTopic && (
                  <AddStatementsForm
                    topicName={currentTopic}
                    onClose={() => setIsAddStatementsOpen(false)}
                    onSuccess={handleAddStatementsSuccess}
                  />
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="evaluations"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <ChartPieLabel/>
        <ChartTooltipDefault/>
        <ChartTooltipDefault/>
          </div>
        {/* <EvaluationsChart data={data} currentTopic={currentTopic} /> */}
      </TabsContent>
    </Tabs>
  )
}

function TableCellViewer({ item }: { item: z.infer<typeof schema> }) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.statement}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.statement}</DrawerTitle>
          <DrawerDescription>
            Test statement details and assessment information
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="statement">Statement</Label>
              <Input id="statement" defaultValue={item.statement} readOnly />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="ai_assessment">AI Assessment</Label>
                <Select defaultValue={item.ai_assessment}>
                  <SelectTrigger id="ai_assessment" className="w-full">
                    <SelectValue placeholder="Select assessment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pass">Pass (Acceptable)</SelectItem>
                    <SelectItem value="fail">Fail (Unacceptable)</SelectItem>
                    <SelectItem value="grading">Grading...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="your_assessment">Your Assessment</Label>
                <Select defaultValue={item.your_assessment}>
                  <SelectTrigger id="your_assessment" className="w-full">
                    <SelectValue placeholder="Select assessment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ungraded">Ungraded</SelectItem>
                    <SelectItem value="acceptable">Acceptable</SelectItem>
                    <SelectItem value="unacceptable">Unacceptable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="topic">Topic</Label>
                <Input id="topic" defaultValue={item.topic} readOnly />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="agreement">Agreement</Label>
                <Input
                  id="agreement"
                  defaultValue={
                    item.agreement === null
                      ? "Pending"
                      : item.agreement
                        ? "Match"
                        : "Mismatch"
                  }
                  readOnly
                />
              </div>
            </div>
            {item.labeler && (
              <div className="flex flex-col gap-3">
                <Label htmlFor="labeler">Labeler</Label>
                <Input id="labeler" defaultValue={item.labeler} readOnly />
              </div>
            )}
            {item.description && (
              <div className="flex flex-col gap-3">
                <Label htmlFor="description">Description</Label>
                <Input id="description" defaultValue={item.description} readOnly />
              </div>
            )}
          </form>
        </div>
        <DrawerFooter>
          <Button>Edit Assessment</Button>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
