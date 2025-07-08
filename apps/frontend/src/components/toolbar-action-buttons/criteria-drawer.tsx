// apps/frontend/src/components/criteria-drawer.tsx

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
import { CriteriaEditor } from "@/components/toolbar-action-buttons/criteria-editor"

interface CriteriaButtonProps {
  currentTopic?: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  inDropdown?: boolean
}

export function CriteriaButton({
  currentTopic,
  isOpen,
  onOpenChange,
  inDropdown = false,
}: CriteriaButtonProps) {
  return (
    <Drawer direction="bottom" open={isOpen} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          title="Manage criteria for perturbations"
          className={inDropdown ? "w-full justify-start" : "justify-start"}
        >
          <IconSettings />
          <span className={inDropdown ? "ml-2" : "hidden xl:inline"}>
            Criteria
          </span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Criteria Editor</DrawerTitle>
          <DrawerDescription>{currentTopic}</DrawerDescription>
        </DrawerHeader>
        <CriteriaEditor
          onClose={() => onOpenChange(false)}
          currentTopic={currentTopic}
        />
      </DrawerContent>
    </Drawer>
  )
}
