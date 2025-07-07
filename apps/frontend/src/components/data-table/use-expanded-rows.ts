// src/components/data-table/use-expanded-rows.ts
import * as React from "react"
import { PerturbationResponse } from "@/types/perturbations"
import { z } from "zod"
import { schema } from "./schema"

export function useExpandedRows(perturbations: Map<string, PerturbationResponse[]>) {
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())

  const toggleExpanded = React.useCallback((rowId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(rowId)) {
        newSet.delete(rowId)
      } else {
        newSet.add(rowId)
      }
      return newSet
    })
  }, [])

  const generateChildRows = React.useCallback(
    (parentRow: z.infer<typeof schema>) => {
      const childRows: z.infer<typeof schema>[] = []
      const parentPerturbations = perturbations.get(parentRow.id) || []

      parentPerturbations.forEach((perturbation) => {
        childRows.push({
          ...parentRow,
          id: perturbation.id,
          statement: perturbation.title,
          parent_id: parentRow.id,
          criteria_text: perturbation.type,
          perturbation_type: perturbation.type,
          ai_assessment: perturbation.label,
          ground_truth: perturbation.ground_truth,
          agreement: null,
        })
      })

      return childRows
    },
    [perturbations]
  )

  return { expandedRows, toggleExpanded, generateChildRows }
}
