"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { IconTrash } from "@tabler/icons-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DeleteTestsButtonProps {
  selectedRowsCount: number
  selectedTestIds: string[]
  onDeleteTests: (testIds: string[]) => Promise<void>
  disabled?: boolean
}

export function DeleteTestsButton({
  selectedRowsCount,
  selectedTestIds,
  onDeleteTests,
  disabled = false
}: DeleteTestsButtonProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDelete = async () => {
    if (selectedTestIds.length === 0) return
    
    setIsDeleting(true)
    try {
      await onDeleteTests(selectedTestIds)
    } finally {
      setIsDeleting(false)
    }
  }

  const isDisabled = disabled || selectedRowsCount === 0 || isDeleting

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={isDisabled}
          title={
            selectedRowsCount === 0
              ? "Select tests to delete"
              : `Delete ${selectedRowsCount} selected test${selectedRowsCount === 1 ? '' : 's'}`
          }
        >
          <IconTrash className="h-4 w-4" />
          {selectedRowsCount > 0 && (
            <span className="ml-1">
              Delete ({selectedRowsCount})
            </span>
          )}
          {selectedRowsCount === 0 && <span className="ml-1">Delete</span>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Tests</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {selectedRowsCount} test{selectedRowsCount === 1 ? '' : 's'}? 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}