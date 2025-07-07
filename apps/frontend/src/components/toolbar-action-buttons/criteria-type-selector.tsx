"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import clsx from "clsx"
import { CriteriaType } from "@/types/criteria"


interface Props {
  items: CriteriaType[]
  selectedItems: Set<string>
  onChangeItems: (items: CriteriaType[]) => void
  onChangeSelected: (selected: Set<string>) => void
}

export function CriteriaTypeSelector({
  items,
  selectedItems,
  onChangeItems,
  onChangeSelected,
}: Props) {
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [formState, setFormState] = useState({ name: "", prompt: "" })

  const toggleItem = (name: string) => {
    const newSet = new Set(selectedItems)
    if (newSet.has(name)) newSet.delete(name)
    else newSet.add(name)
    onChangeSelected(newSet)
  }

  const handleAddNew = () => {
    setActiveItem("NEW_TYPE")
    setFormState({ name: "", prompt: "" })
  }

  const handleSelect = (name: string) => {
    const existing = items.find((i) => i.name === name)
    if (!existing) return
    setActiveItem(name)
    setFormState({ name: existing.name, prompt: existing.prompt })
  }

  const handleSave = () => {
    const { name, prompt } = formState
    if (!name.trim() || !prompt.trim()) return

    const exists = items.find((item) => item.name === name)
    if (!exists) {
      const newItem = { name, prompt, isDefault: false }
      onChangeItems([...items, newItem])
      onChangeSelected(new Set(selectedItems).add(name))
    } else if (!exists.isDefault) {
      // Edit existing custom
      onChangeItems(items.map((i) => (i.name === name ? { ...i, prompt } : i)))
    }

    setActiveItem(name)
  }

  const handleDelete = () => {
    if (!activeItem) return
    const updated = items.filter((i) => i.name !== activeItem)
    const newSelected = new Set(selectedItems)
    newSelected.delete(activeItem)
    onChangeItems(updated)
    onChangeSelected(newSelected)
    setActiveItem(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center flex-wrap">
        {items.map((item) => {
          const isChecked = selectedItems.has(item.name)
          return (
            <div
              key={item.name}
              className={clsx(
                "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
                item.isDefault
                  ? "bg-background border border-muted"
                  : "bg-background border border-muted text-green-600",
                isChecked ? "ring-2 ring-muted-foreground/30" : ""
              )}
            >
              <Checkbox
                id={item.name}
                checked={isChecked}
                onCheckedChange={() => toggleItem(item.name)}
              />
              <span
                role="button"
                tabIndex={0}
                className="text-sm hover:underline focus:outline-none"
                onClick={() => handleSelect(item.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSelect(item.name)
                }}
              >
                {item.name}
              </span>
            </div>
          )
        })}

        <button
          type="button"
          onClick={handleAddNew}
          className="px-3 py-2 border border-dashed rounded-md text-sm hover:bg-muted transition-colors"
        >
          + Add New
        </button>
      </div>

      {activeItem && (
        <div className="mt-4 border p-4 rounded bg-muted space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type-name">Type:</Label>
            <Input
              id="type-name"
              value={formState.name}
              disabled={activeItem !== "NEW_TYPE"}
              onChange={(e) =>
                setFormState((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="e.g. spelling"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type-prompt">AI Prompt:</Label>
            <Input
              id="type-prompt"
              value={formState.prompt}
              disabled={items.find((i) => i.name === activeItem)?.isDefault}
              onChange={(e) =>
                setFormState((f) => ({ ...f, prompt: e.target.value }))
              }
              placeholder="Enter AI prompt"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleSave}
              disabled={
                items.find((i) => i.name === activeItem)?.isDefault === true
              }
            >
              Save Type
            </Button>
            {!items.find((i) => i.name === activeItem)?.isDefault && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                Delete Type
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
