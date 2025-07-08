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
  inDropdown?: boolean
}

export function AddStatementsButton({
  currentTopic,
  isOpen,
  onOpenChange,
  onSuccess,
  inDropdown = false,
}: AddStatementsButtonProps) {
  return (
    <Drawer direction="bottom" open={isOpen} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={!currentTopic}
          title={
            !currentTopic
              ? "Select a topic to add statements"
              : "Add statements to this topic"
          }
          className={inDropdown ? "w-full justify-start" : "justify-start"}
        >
          <IconPlus />
          <span className={inDropdown ? "ml-2" : "hidden xl:inline"}>
            Add Statements
          </span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add Statements</DrawerTitle>
          <DrawerDescription>
            Add new test statements to the current topic: {currentTopic}
          </DrawerDescription>
        </DrawerHeader>
        {currentTopic && (
          <AddStatementsForm
            topicName={currentTopic}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DrawerContent>
    </Drawer>
  )
}
