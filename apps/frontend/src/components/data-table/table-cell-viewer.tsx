// src/components/data-table/table-cell-viewer.tsx
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { z } from "zod"
import { useIsMobile } from "@/hooks/use-mobile"
import { schema } from "./schema"
import { useState, useEffect } from "react"
import { editTest } from "@/lib/api/tests"
import { toast } from "sonner"

interface TableCellViewerProps {
  item: z.infer<typeof schema>
  onUpdate?: (updatedItem: z.infer<typeof schema>) => void
}

export function TableCellViewer({ item, onUpdate }: TableCellViewerProps) {
  const isMobile = useIsMobile()
  const [editedStatement, setEditedStatement] = useState(item.statement)
  const [editedAssessment, setEditedAssessment] = useState(item.ground_truth)
  const [isLoading, setIsLoading] = useState(false)

  // Reset form values when item changes
  useEffect(() => {
    setEditedStatement(item.statement)
    setEditedAssessment(item.ground_truth)
  }, [item.statement, item.ground_truth])

  const handleSave = async () => {
    if (!editedStatement.trim()) {
      toast.error("Statement cannot be empty")
      return
    }

    setIsLoading(true)
    try {
      await editTest(item.id, {
        title: editedStatement,
        ground_truth: editedAssessment
      })
      
      // Check if statement text changed to trigger re-grading
      const statementChanged = editedStatement !== item.statement
      
      // Update the item locally
      const updatedItem = {
        ...item,
        statement: editedStatement,
        ground_truth: editedAssessment,
        // If statement changed, set AI assessment to grading state
        ai_assessment: statementChanged ? "grading" as const : item.ai_assessment
      }
      
      onUpdate?.(updatedItem)
      toast.success("Statement updated successfully" + (statementChanged ? " - AI re-grading in progress" : ""))
    } catch (error) {
      console.error("Error updating statement:", error)
      toast.error("Failed to update statement")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button
          variant="link"
          className="text-foreground px-0 text-left h-auto break-words justify-start whitespace-normal"
        >
          {item.statement}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Edit Statement</DrawerTitle>
          <DrawerDescription>
            Modify the statement and assessment
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="statement">Statement</Label>
              <Input
                id="statement"
                value={editedStatement}
                onChange={(e) => setEditedStatement(e.target.value)}
                placeholder="Enter statement text..."
              />
            </div>

            <div className="flex flex-col gap-3">
              <Label>Your Assessment</Label>
              <RadioGroup
                value={editedAssessment}
                onValueChange={(value) => setEditedAssessment(value as "acceptable" | "unacceptable" | "ungraded")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="acceptable" id="acceptable" />
                  <Label htmlFor="acceptable">Acceptable</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unacceptable" id="unacceptable" />
                  <Label htmlFor="unacceptable">Unacceptable</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
        <DrawerFooter>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
