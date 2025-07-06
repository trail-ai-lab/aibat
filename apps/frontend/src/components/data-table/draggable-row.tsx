// src/components/data-table/draggable-row.tsx
import { CSS } from "@dnd-kit/utilities"
import { useSortable } from "@dnd-kit/sortable"
import { TableRow, TableCell } from "@/components/ui/table"
import { flexRender, Row } from "@tanstack/react-table"
import { z } from "zod"
import { schema } from "./schema"

export function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const isChildRow = !!row.original.parent_id
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
    disabled: isChildRow,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className={`relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 ${
        isChildRow ? "bg-muted/30" : ""
      }`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          className={isChildRow ? "border-l-2 border-l-muted-foreground/20" : ""}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}
