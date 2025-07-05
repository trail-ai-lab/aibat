"use client"

import * as React from "react"
import { IconSettings } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { CriteriaEditor } from "@/components/criteria-editor"

interface CriteriaManagerProps {
  currentTopic?: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function CriteriaManager({
  currentTopic,
  isOpen,
  onOpenChange,
}: CriteriaManagerProps) {
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
          title="Manage criteria for perturbations"
        >
          <IconSettings />
          <span className="hidden lg:inline">Criteria</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>Criteria Editor</DrawerTitle>
          <DrawerDescription>
            {currentTopic}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4">
          <CriteriaEditor
            onClose={() => onOpenChange(false)}
            currentTopic={currentTopic}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}