"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  addStatementsToTopic,
  type AddStatementsRequest,
} from "@/lib/api/tests"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { IconLoader } from "@tabler/icons-react"
import { TestStatementsSection } from "@/components/shared/test-statements-section"

const formSchema = z.object({
  tests: z
    .array(
      z.object({
        test: z.string().optional(),
        ground_truth: z.enum(["acceptable", "unacceptable"]).optional(),
      })
    )
    .length(10),
})

type FormValues = z.infer<typeof formSchema>

type AddStatementsFormProps = {
  topicName: string
  onClose: () => void
  onSuccess: () => void
}

export function AddStatementsForm({
  topicName,
  onClose,
  onSuccess,
}: AddStatementsFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tests: Array(10).fill({ test: "", ground_truth: undefined }),
    },
  })

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = form

  const onSubmit = async (values: FormValues) => {
    const validTests = values.tests.flatMap(({ test, ground_truth }) => {
      if (test?.trim()) {
        if (!ground_truth) {
          toast.error("Please select a ground truth for all filled tests.")
          throw new Error("Please select a ground truth for all filled tests.")
        }
        return [{ test: test.trim(), ground_truth }]
      }
      return []
    })

    if (validTests.length === 0) {
      toast.error("Please enter at least one test statement.")
      return
    }

    const statementsData: AddStatementsRequest = {
      topic: topicName,
      tests: validTests,
    }

    try {
      await addStatementsToTopic(statementsData)
      toast.success(
        `Successfully added ${validTests.length} statements to "${topicName}"!`
      )
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error("Failed to add statements")
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <Form {...form}>
        <div className="flex flex-col max-h-[calc(80vh-8rem)] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <form
              id="add-statements-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Test Statements Section */}
              <TestStatementsSection
                control={form.control}
                name="tests"
                testCount={10}
                description="Add test statements and mark them as acceptable or unacceptable. At least one test is required."
              />
            </form>
          </div>

          {/* Fixed Action Buttons */}
          <div className="border-t bg-background p-6">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-start sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
                form="add-statements-form"
              >
                {isSubmitting ? (
                  <>
                    <IconLoader className="w-4 h-4 mr-2 animate-spin" />
                    Adding Statements...
                  </>
                ) : (
                  "Add Statements"
                )}
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
      </Form>
    </div>
  )
}
