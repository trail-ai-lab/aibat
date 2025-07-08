"use client"

import { useState } from "react"
import { IconChevronDown, IconLoader, IconRobot } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useModels } from "@/hooks/use-models"

interface ModelSelectorProps {
  currentTopic?: string
  selectedModel?: string
  onSelectModel?: (modelId: string) => void
}

export function ModelSelector({
  currentTopic,
  selectedModel,
  onSelectModel,
}: ModelSelectorProps = {}) {
  const {
    models,
    loading,
    selectedModel: hookModel,
    handleModelSelect,
  } = useModels()
  const [isOpen, setIsOpen] = useState(false)

  const activeModelId = selectedModel ?? hookModel
  const currentModel = models.find((model) => model.id === activeModelId)

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <IconLoader className="animate-spin mr-2" />
        <span className="hidden lg:inline">Loading Models...</span>
        <span className="lg:hidden">Loading...</span>
      </Button>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <IconRobot className="size-4" />
            <span className="hidden lg:inline">
              {currentModel?.name || "Select Model"}
            </span>
            <span className="lg:hidden">Model</span>
          </div>
          <IconChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-full max-w-sm">
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => {
              if (onSelectModel) {
                onSelectModel(model.id)
              } else {
                handleModelSelect(model.id, currentTopic)
              }
              setIsOpen(false)
            }}
            className={activeModelId === model.id ? "bg-accent" : ""}
          >
            <div className="flex items-center justify-between w-full">
              <span>{model.name}</span>
              {activeModelId === model.id && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
