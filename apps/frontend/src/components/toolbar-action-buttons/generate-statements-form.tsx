"use client"

import * as React from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { IconLoader, IconSparkles } from "@tabler/icons-react"
import {
  generateStatementsForTopic,
  type GenerateStatementsRequest,
} from "@/lib/api/tests"

const FormSchema = z.object({
  criteria: z.string(),
  numStatements: z.number().min(1).max(10),
})

type GenerateStatementsFormProps = {
  topicName: string
  onClose: () => void
  onSuccess: () => void
}

export function GenerateStatementsForm({
  topicName,
  onClose,
  onSuccess,
}: GenerateStatementsFormProps) {
  const [isGenerating, setIsGenerating] = React.useState(false)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      criteria: "base",
      numStatements: 3,
    },
  })

  const watchedStatements = form.watch("numStatements")

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsGenerating(true)

    const generationData: GenerateStatementsRequest = {
      topic: topicName,
      criteria: data.criteria,
      num_statements: data.numStatements,
    }

    try {
      const result = await generateStatementsForTopic(generationData)
      toast.success(
        `Successfully generated ${result.added_count} statements for "${topicName}"!`
      )
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error("Failed to generate statements")
    } finally {
      setIsGenerating(false)
    }
  }

  const criteriaOptions = [
    { value: "base", label: "Base - Similar variations" },
    { value: "paraphrase", label: "Paraphrase - Different wording" },
    { value: "synonyms", label: "Synonyms - Replace with similar words" },
    { value: "antonyms", label: "Antonyms - Opposite meanings" },
    { value: "negation", label: "Negation - Add 'not' for opposites" },
    { value: "spanish", label: "Spanish - Spanish versions" },
    { value: "english", label: "English - English versions" },
    { value: "spanglish", label: "Spanglish - Mixed English-Spanish" },
    { value: "nouns", label: "Nouns - Change only nouns" },
    { value: "cognates", label: "Cognates - Similar sounding words" },
    { value: "colloquial", label: "Colloquial - Informal language" },
    { value: "loan_word", label: "Loan Words - Borrowed words" },
    { value: "dialect", label: "Dialect - Regional variations" },
  ]

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-h-[70vh] overflow-y-auto px-6 py-4"
      >
        <FormField
          control={form.control}
          name="criteria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Generation Criteria</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select generation criteria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {criteriaOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose how the AI should generate new statements based on
                existing ones.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="numStatements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Statements: {watchedStatements}</FormLabel>
              <FormControl>
                <Slider
                  value={[field.value]}
                  onValueChange={(val) => field.onChange(val[0])}
                  min={1}
                  max={10}
                  step={1}
                />
              </FormControl>
              <FormDescription>
                Use the slider to choose how many statements to generate.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 pt-4">
          <Button type="submit" disabled={isGenerating} className="w-full">
            {isGenerating ? (
              <>
                <IconLoader className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <IconSparkles className="w-4 h-4 mr-2" />
                Generate Statements
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
