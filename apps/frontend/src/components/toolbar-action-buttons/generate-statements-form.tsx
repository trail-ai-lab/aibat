"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconLoader, IconSparkles } from "@tabler/icons-react"
import { generateStatementsForTopic, type GenerateStatementsRequest } from "@/lib/api/tests"
import { toast } from "sonner"

type GenerateStatementsFormProps = {
  topicName: string
  onClose: () => void
  onSuccess: () => void
}

export function GenerateStatementsForm({ topicName, onClose, onSuccess }: GenerateStatementsFormProps) {
  const [criteria, setCriteria] = useState("base")
  const [numStatements, setNumStatements] = useState("5")
  const [isGenerating, setIsGenerating] = useState(false)
  const [submitErrorMsg, setSubmitErrorMsg] = useState("")

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
    { value: "dialect", label: "Dialect - Regional variations" }
  ]

  const handleGenerateStatements = async () => {
    setIsGenerating(true)
    setSubmitErrorMsg("")

    const generationData: GenerateStatementsRequest = {
      topic: topicName,
      criteria: criteria,
      num_statements: parseInt(numStatements)
    }

    try {
      const result = await generateStatementsForTopic(generationData)
      toast.success(`Successfully generated ${result.generated_count} statements for "${topicName}"!`)
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      setSubmitErrorMsg(error instanceof Error ? error.message : "Failed to generate statements")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="w-full flex flex-col max-h-[70vh] overflow-y-auto">
      <div className="px-6 py-4 w-full space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="criteria" className="text-sm font-bold">
              Generation Criteria:
            </Label>
            <Select value={criteria} onValueChange={setCriteria}>
              <SelectTrigger id="criteria">
                <SelectValue placeholder="Select generation criteria" />
              </SelectTrigger>
              <SelectContent>
                {criteriaOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose how the AI should generate new statements based on existing ones.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="num-statements" className="text-sm font-bold">
              Number of Statements:
            </Label>
            <Select value={numStatements} onValueChange={setNumStatements}>
              <SelectTrigger id="num-statements">
                <SelectValue placeholder="Select number of statements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 statements</SelectItem>
                <SelectItem value="5">5 statements</SelectItem>
                <SelectItem value="10">10 statements</SelectItem>
                <SelectItem value="15">15 statements</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4">
          {isGenerating ? (
            <Button disabled className="w-40">
              <IconLoader className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </Button>
          ) : (
            <Button onClick={handleGenerateStatements} className="w-40">
              <IconSparkles className="w-4 h-4 mr-2" />
              Generate Statements
            </Button>
          )}
          <Button variant="outline" onClick={onClose} className="w-32">
            Cancel
          </Button>
          {submitErrorMsg && (
            <div className="text-sm text-red-600 font-light">
              {submitErrorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}