"use client"

import * as React from "react"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { SettingsForm } from "@/components/sidebar-nav/settings-form"

interface SettingsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTopic?: string
  onSuccess?: () => void
}

export function SettingsDrawer({
  open,
  onOpenChange,
  currentTopic,
  onSuccess,
}: SettingsDrawerProps) {
  const handleSuccess = () => {
    onSuccess?.()
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader className="gap-1">
            <DrawerTitle>Settings</DrawerTitle>
            <DrawerDescription>
              Configure your AI model settings.
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex flex-col gap-4 overflow-y-auto px-4">
            <SettingsForm
              currentTopic={currentTopic}
              onClose={() => onOpenChange(false)}
              onSuccess={handleSuccess}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
