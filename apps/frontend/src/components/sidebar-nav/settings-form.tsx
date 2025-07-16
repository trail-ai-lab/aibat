"use client"

import * as React from "react"
import { z } from "zod"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import { useModels } from "@/hooks/use-models"
import { ModelSelector } from "@/components/sidebar-nav/model-selector"

const settingsSchema = z.object({
  model: z.string().min(1, "Please select a model"),
})

type SettingsFormProps = {
  currentTopic?: string
  onClose: () => void
  onSuccess: () => void
}

export function SettingsForm({
  currentTopic,
  onClose,
  onSuccess,
}: SettingsFormProps) {
  const { models, selectedModel, handleModelSelect } = useModels()

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      model: selectedModel || "",
    },
  })

  const onSubmit = (data: z.infer<typeof settingsSchema>) => {
    handleModelSelect(data.model, currentTopic)
    toast.success(
      `Model set to ${models.find((m) => m.id === data.model)?.name}`
    )
    onSuccess()
    onClose()
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 px-6 py-4"
      >
        <Controller
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>AI Model</FormLabel>
              <ModelSelector
                currentTopic={currentTopic}
                {...field}
                selectedModel={field.value}
                onSelectModel={(val) => field.onChange(val)}
              />
              <FormDescription>
                Select the LLM model to use for generation.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 pt-4">
          <Button type="submit" className="w-full">
            Done
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
