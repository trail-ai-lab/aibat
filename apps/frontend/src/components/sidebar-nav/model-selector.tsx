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
}

export function ModelSelector({ currentTopic }: ModelSelectorProps = {}) {
  const { models, loading, selectedModel, handleModelSelect } = useModels()
  const [isOpen, setIsOpen] = useState(false)

  const currentModel = models.find(model => model.id === selectedModel)

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <IconLoader className="animate-spin" />
        <span className="hidden lg:inline">Loading Models...</span>
        <span className="lg:hidden">Loading...</span>
      </Button>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <IconRobot />
          <span className="hidden lg:inline">
            {currentModel?.name || 'Select Model'}
          </span>
          <span className="lg:hidden">Model</span>
          <IconChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => {
              handleModelSelect(model.id, currentTopic)
              setIsOpen(false)
            }}
            className={selectedModel === model.id ? "bg-accent" : ""}
          >
            <div className="flex items-center justify-between w-full">
              <span>{model.name}</span>
              {selectedModel === model.id && (
                <div className="w-2 h-2 bg-primary rounded-full" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}