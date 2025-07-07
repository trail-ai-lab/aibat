// apps/frontend/src/components/add-statements-button.tsx

"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { IconPlus } from "@tabler/icons-react"
import { AddStatementsForm } from "@/components/toolbar-action-buttons/add-statements-form"

interface AddStatementsButtonProps {
  currentTopic?: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddStatementsButton({
  currentTopic,
  isOpen,
  onOpenChange,
  onSuccess, // ✅ accept this
}: AddStatementsButtonProps) {
  return (
    <Drawer direction="bottom" open={isOpen} onOpenChange={onOpenChange}>
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
              onClose={() => onOpenChange(false)}
              onSuccess={onSuccess}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
