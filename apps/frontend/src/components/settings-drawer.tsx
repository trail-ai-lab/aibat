"use client"

import * as React from "react"
import {
  IconSettings,
  IconRobot,
  IconX,
} from "@tabler/icons-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ModelSelector } from "@/components/model-selector"

interface SettingsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTopic?: string
}

export function SettingsDrawer({
  open,
  onOpenChange,
  currentTopic,
}: SettingsDrawerProps) {

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconSettings className="size-5" />
                <DrawerTitle>Settings</DrawerTitle>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="size-6">
                  <IconX className="size-4" />
                </Button>
              </DrawerClose>
            </div>
            <DrawerDescription>
              Configure your AI model settings.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-6">
            {/* Model Selection Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <IconRobot className="size-4" />
                <Label className="text-sm font-medium">AI Model</Label>
              </div>
              <div className="pl-6">
                <ModelSelector currentTopic={currentTopic} />
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}