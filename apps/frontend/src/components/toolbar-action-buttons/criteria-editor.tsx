"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { CriteriaTypeSelector } from "@/components/toolbar-action-buttons/criteria-type-selector"
import { useCriteria } from "@/hooks/use-criteria"
import { Button } from "@/components/ui/button"
import { fetchUserCriteria, saveUserCriteria } from "@/lib/api/criteria"
import { toast } from "sonner"
import { CriteriaType } from "@/types/criteria"

interface CriteriaEditorProps {
  onClose: () => void
  currentTopic?: string
}

export function CriteriaEditor({ onClose, currentTopic }: CriteriaEditorProps) {
  const { criteriaConfigs, loading } = useCriteria()

  const [appConfig, setAppConfig] = useState<string>("")
  const [items, setItems] = useState<CriteriaType[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  // Set initial config on load
  useEffect(() => {
    const load = async () => {
      const config = criteriaConfigs.find((c) => c.config === appConfig)
      if (!config || !currentTopic) return

      const defaultTypes: CriteriaType[] = config.types.map((t: any) => ({
        ...t,
        isDefault: true,
      }))

      try {
        const userTypes = await fetchUserCriteria(currentTopic)
        const userTypeNames = new Set(userTypes.map((t) => t.name))

        // Combine: include user types (with isDefault false) + ensure only saved ones are selected
        const combinedItems: CriteriaType[] = [
          ...defaultTypes,
          ...userTypes.filter(
            (t) => !defaultTypes.find((d) => d.name === t.name)
          ),
        ]

        const selected = new Set(userTypes.map((t) => t.name))

        setItems(combinedItems)
        setSelectedItems(selected)
      } catch (err) {
        toast.error("Failed to load user criteria")
        // fallback to defaults if user config not found
        setItems(defaultTypes)
        setSelectedItems(new Set(defaultTypes.map((t) => t.name)))
      }
    }

    if (!loading && appConfig && currentTopic) {
      load()
    }
  }, [appConfig, criteriaConfigs, currentTopic, loading])

  // Update state when config changes
  useEffect(() => {
    const config = criteriaConfigs.find((c) => c.config === appConfig)
    if (config) {
      const defaultTypes: CriteriaType[] = config.types.map((t: any) => ({
        ...t,
        isDefault: true,
      }))
      setItems(defaultTypes)
      setSelectedItems(new Set(defaultTypes.map((t) => t.name)))
    }
  }, [appConfig, criteriaConfigs])

  const handleConfigChange = (value: string) => {
    setAppConfig(value)
  }

  // Set default config to first item when loaded
  useEffect(() => {
    if (!loading && criteriaConfigs.length > 0 && !appConfig) {
      setAppConfig(criteriaConfigs[0].config)
    }
  }, [loading, criteriaConfigs, appConfig])

  const handleSave = async () => {
    console.log("Criteria Save: ", currentTopic)
    if (!currentTopic) return

    const selected = items
      .filter((item) => selectedItems.has(item.name))
      .map(({ name, prompt, isDefault }) => ({ name, prompt, isDefault }))

    try {
      await saveUserCriteria(currentTopic, selected)
      toast.success("Criteria saved successfully!")
      onClose()
    } catch (err) {
      toast.error("Failed to save criteria.")
      console.error(err)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="flex flex-col max-h-[calc(80vh-8rem)] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Criteria Configuration Dropdown */}
          <div className="flex items-center gap-4">
            <Label htmlFor="config-select">Criteria Configuration:</Label>
            <Select value={appConfig} onValueChange={handleConfigChange}>
              <SelectTrigger className="w-48" id="config-select">
                <SelectValue placeholder="Select configuration" />
              </SelectTrigger>
              <SelectContent>
                {criteriaConfigs.map((config) => (
                  <SelectItem key={config.config} value={config.config}>
                    {config.config}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Criteria Type Selector */}
          <div className="space-y-4">
            <Label>Types:</Label>
            <CriteriaTypeSelector
              items={items}
              selectedItems={selectedItems}
              onChangeItems={setItems}
              onChangeSelected={setSelectedItems}
            />
          </div>
        </div>

        {/* Fixed Action Buttons */}
        <div className="border-t bg-background p-6">
          <div className="flex flex-col-reverse sm:flex-row sm:justify-start sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0">
            <Button onClick={handleSave} className="w-full sm:w-auto">
              Save Criteria
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
