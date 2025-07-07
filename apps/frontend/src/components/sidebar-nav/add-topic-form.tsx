"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { addTopic } from "@/lib/api/topics"
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
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { IconLoader } from "@tabler/icons-react"

const formSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  prompt: z.string().min(1, "Prompt is required"),
  isDefaultGradingPrompt: z.boolean(),
  tests: z
    .array(
      z.object({
        test: z.string().optional(),
        ground_truth: z.enum(["acceptable", "unacceptable"]).optional(),
      })
    )
    .length(5),
})

type FormValues = z.infer<typeof formSchema>

export function AddTopicForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (topicName: string) => void
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      prompt: "",
      isDefaultGradingPrompt: true,
      tests: Array(5).fill({ test: "", ground_truth: undefined }),
    },
  })

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = form

  const topic = watch("topic")
  const isDefaultGradingPrompt = watch("isDefaultGradingPrompt")

  React.useEffect(() => {
    if (isDefaultGradingPrompt) {
      setValue(
        "prompt",
        `Is this sentence an acceptable or unacceptable statement about ${
          topic || "{topic}"
        }? Here is the sentence:`
      )
    }
  }, [isDefaultGradingPrompt, topic, setValue])

  const onSubmit = async (values: FormValues) => {
    const validTests = values.tests.flatMap(({ test, ground_truth }) => {
      if (test?.trim()) {
        if (!ground_truth) {
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

    const topicData = {
      topic: values.topic.trim(),
      prompt_topic: values.prompt.trim(),
      tests: validTests,
      default: false,
    }

    try {
      await addTopic(topicData)
      toast.success(`Topic "${topicData.topic}" created successfully!`)
      onSuccess(topicData.topic)
      onClose()
    } catch (error) {
      console.error(error)
      toast.error("Failed to add topic")
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <Form {...form}>
        <div className="flex flex-col max-h-[calc(80vh-8rem)] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <form
              id="add-topic-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Topic Information</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-12">
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-3">
                        <FormLabel>Topic Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Energy Concepts"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-9">
                        <FormLabel>Assessment Prompt</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Prompt related to topic"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isDefaultGradingPrompt"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(checked === true)
                          }
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">
                          Use default grading prompt
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Automatically generate a standard assessment prompt
                          based on the topic name.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Test Statements Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Test Statements</h3>
                  <p className="text-sm text-muted-foreground">
                    Add test statements and mark them as acceptable or
                    unacceptable. At least one test is required.
                  </p>
                </div>

                <div className="space-y-4">
                  {form.watch("tests").map((_, i) => (
                    <div key={i} className="space-y-2">
                      {/* Label Row */}
                      <div className="flex justify-between">
                        <FormLabel className="text-sm font-medium">
                          Test Statement {i + 1}
                        </FormLabel>
                      </div>

                      {/* Input + Radio Group Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
                        {/* Test Input: grows */}
                        <FormField
                          control={form.control}
                          name={`tests.${i}.test`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={`Enter test statement ${
                                    i + 1
                                  }...`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Radio Group: fixed width */}
                        <FormField
                          control={form.control}
                          name={`tests.${i}.ground_truth`}
                          render={({ field }) => (
                            <FormItem className="shrink-0">
                              <FormControl>
                                <RadioGroup
                                  className="flex gap-4"
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                      value="acceptable"
                                      id={`acc-${i}`}
                                    />
                                    <FormLabel
                                      htmlFor={`acc-${i}`}
                                      className="cursor-pointer"
                                    >
                                      Acceptable
                                    </FormLabel>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                      value="unacceptable"
                                      id={`unacc-${i}`}
                                    />
                                    <FormLabel
                                      htmlFor={`unacc-${i}`}
                                      className="cursor-pointer"
                                    >
                                      Unacceptable
                                    </FormLabel>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </div>

          {/* Fixed Action Buttons */}
          <div className="border-t bg-background p-6">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-start sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
                form="add-topic-form"
              >
                {isSubmitting ? (
                  <>
                    <IconLoader className="w-4 h-4 mr-2 animate-spin" />
                    Adding Topic...
                  </>
                ) : (
                  "Add Topic"
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
