"use client"

import * as React from "react"
import { IconSparkles } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { GenerateStatementsForm } from "@/components/toolbar-action-buttons/generate-statements-form"

interface GenerateStatementButtonProps {
  currentTopic?: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onDataRefresh?: () => void
  onSuccess?: () => void
}

export function GenerateStatementsButton({
  currentTopic,
  isOpen,
  onOpenChange,
  onDataRefresh,
  onSuccess,
}: GenerateStatementButtonProps) {
  const handleSuccess = () => {
    onSuccess?.()
    onOpenChange(false)
  }

  return (
    <Drawer
      direction="bottom"
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={!currentTopic}
          title={!currentTopic ? "Select a topic to generate statements" : "Generate AI statements for this topic"}
          className="justify-start"
        >
          <IconSparkles />
          <span className="hidden xl:inline">Generate Statements</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Generate Statements</DrawerTitle>
          <DrawerDescription>
            Generate new test statements using AI based on existing statements
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4">
          {currentTopic && (
            <GenerateStatementsForm
              topicName={currentTopic}
              onClose={() => onOpenChange(false)}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
