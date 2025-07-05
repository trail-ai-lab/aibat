"use client"

import * as React from "react"
import { IconPlus, IconSparkles } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { AddStatementsForm } from "@/components/add-statements-form"
import { GenerateStatementsForm } from "@/components/generate-statements-form"

interface TestManagerProps {
  currentTopic?: string
  isAddStatementsOpen: boolean
  onAddStatementsOpenChange: (open: boolean) => void
  isGenerateStatementsOpen: boolean
  onGenerateStatementsOpenChange: (open: boolean) => void
  onDataRefresh?: () => void
}

export function TestManager({
  currentTopic,
  isAddStatementsOpen,
  onAddStatementsOpenChange,
  isGenerateStatementsOpen,
  onGenerateStatementsOpenChange,
  onDataRefresh,
}: TestManagerProps) {
  const handleAddStatementsSuccess = () => {
    // Refresh the data after successfully adding statements
    onDataRefresh?.()
  }

  const handleGenerateStatementsSuccess = () => {
    // Refresh the data after successfully generating statements
    onDataRefresh?.()
  }

  return (
    <>
      {/* Add Statements Drawer */}
      <Drawer
        direction="bottom"
        open={isAddStatementsOpen}
        onOpenChange={onAddStatementsOpenChange}
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
                onClose={() => onAddStatementsOpenChange(false)}
                onSuccess={handleAddStatementsSuccess}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Generate Statements Drawer */}
      <Drawer
        direction="bottom"
        open={isGenerateStatementsOpen}
        onOpenChange={onGenerateStatementsOpenChange}
      >
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!currentTopic}
            title={!currentTopic ? "Select a topic to generate statements" : "Generate AI statements for this topic"}
          >
            <IconSparkles />
            <span className="hidden lg:inline">Generate Statements</span>
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
                onClose={() => onGenerateStatementsOpenChange(false)}
                onSuccess={handleGenerateStatementsSuccess}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}