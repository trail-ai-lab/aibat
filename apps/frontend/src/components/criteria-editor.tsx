"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { IconLoader, IconPlus, IconTrash, IconEdit } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  getAllPerturbationTypes,
  getPerturbationInfo,
  addCustomPerturbation,
  editPerturbation,
  deletePerturbationType,
  testNewPerturbation,
  getDefaultPerturbations,
  type PerturbationResponse,
} from "@/lib/api/tests"

interface CriteriaEditorProps {
  onClose: () => void
  currentTopic?: string
}

const DEFAULT_CRITERIA_CONFIGS = ["AIBAT", "Mini-AIBAT", "M-AIBAT"]

export function CriteriaEditor({ onClose, currentTopic }: CriteriaEditorProps) {
  const [selectedCriteria, setSelectedCriteria] = useState<string>("+")
  const [criteriaTypes, setCriteriaTypes] = useState<CriteriaType[]>([])
  const [defaultCriteria, setDefaultCriteria] = useState<string[]>([])
  const [originalCriteria, setOriginalCriteria] = useState<string[]>([])
  const [appConfig, setAppConfig] = useState<string>("AIBAT")

  // Form states
  const [type, setType] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")
  const [testStatement, setTestStatement] = useState(
    "For both the initial drop and hill, the greater the height, the more energy"
  )
  const [testDirection, setTestDirection] = useState("")

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isTestingPrompt, setIsTestingPrompt] = useState(false)

  // Test result
  const [testResult, setTestResult] = useState("")
  const [isFailedSubmit, setIsFailedSubmit] = useState(false)

  useEffect(() => {
    loadCriteriaData()
  }, [appConfig])

  const loadCriteriaData = async () => {
    try {
      // Load all criteria types
      const types = await getAllPerturbationTypes()
      setCriteriaTypes(types)

      // Load default criteria for current config
      const defaultTypes = await getDefaultPerturbations(appConfig)
      setDefaultCriteria(defaultTypes)

      // For M-AIBAT, also load original AIBAT criteria
      if (appConfig === "M-AIBAT") {
        const originalTypes = await getDefaultPerturbations("AIBAT")
        setOriginalCriteria(originalTypes.filter((p: string) => !defaultTypes.includes(p)))
      }
    } catch (error) {
      console.error("Error loading criteria data:", error)
      toast.error("Failed to load criteria data")
    }
  }

  const handleConfigChange = (newConfig: string) => {
    setAppConfig(newConfig)
    setSelectedCriteria("+")
    setType("")
    setAiPrompt("")
    setTestDirection("")
  }

  const handleSelectCriteria = async (criteriaType: string) => {
    setSelectedCriteria(criteriaType)
    
    if (criteriaType === "+") {
      setType("")
      setAiPrompt("")
      setTestDirection("")
      return
    }

    if (isOriginal(criteriaType)) {
      setType(criteriaType)
      setAiPrompt("Default AI Prompt")
      setTestDirection("INV")
      return
    }

    if (isDefault(criteriaType)) {
      setType(criteriaType)
      setAiPrompt("Default AI Prompt")
      setTestDirection("INV")
      return
    }

    try {
      const info = await getPerturbationInfo(criteriaType)
      setType(info.name)
      setAiPrompt(info.prompt)
      setTestDirection(info.flip_label ? "DIR" : "INV")
    } catch (error) {
      console.error("Error loading criteria info:", error)
      toast.error("Failed to load criteria information")
    }
  }

  const handleTestPrompt = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isTestingPrompt || !testStatement || !aiPrompt || (appConfig === "AIBAT" && !testDirection)) {
      return
    }

    setIsTestingPrompt(true)

    try {
      const result = await testNewPerturbation({
        prompt: aiPrompt,
        test_case: testStatement
      })
      setTestResult(result.perturbed)
    } catch (error) {
      console.error("Error testing prompt:", error)
      toast.error("Failed to test prompt")
    } finally {
      setIsTestingPrompt(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting || !type || !aiPrompt || (appConfig === "AIBAT" && !testDirection)) {
      setIsFailedSubmit(true)
      return
    }

    setIsFailedSubmit(false)
    setIsSubmitting(true)

    try {
      await addCustomPerturbation({
        name: type,
        prompt: aiPrompt,
        flip_label: testDirection === "DIR"
      })

      toast.success(`Added new criteria '${type}'`)
      await loadCriteriaData()
      onClose()
    } catch (error) {
      console.error("Error adding criteria:", error)
      toast.error("Failed to add criteria")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!aiPrompt) {
      return
    }

    setIsEditing(true)

    try {
      await editPerturbation({
        name: selectedCriteria,
        prompt: aiPrompt,
        flip_label: testDirection === "DIR"
      })

      toast.success(`Updated criteria '${type}'`)
      await loadCriteriaData()
      onClose()
    } catch (error) {
      console.error("Error editing criteria:", error)
      toast.error("Failed to edit criteria")
    } finally {
      setIsEditing(false)
    }
  }

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsDeleting(true)

    try {
      await deletePerturbationType(selectedCriteria)
      toast.success(`Deleted criteria '${type}'`)
      await loadCriteriaData()
      setSelectedCriteria("+")
    } catch (error) {
      console.error("Error deleting criteria:", error)
      toast.error("Failed to delete criteria")
    } finally {
      setIsDeleting(false)
    }
  }

  const isDefault = (criteriaType: string) => defaultCriteria.includes(criteriaType)
  const isOriginal = (criteriaType: string) => originalCriteria.includes(criteriaType)

  return (
    <div className="w-full h-full flex flex-col justify-between">
      {/* Header */}
      <div className="text-2xl p-4 font-light w-full text-center">
        Criteria Editor
      </div>

      {/* Configuration Selection */}
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Label htmlFor="config-select">Criteria Configuration:</Label>
          <Select value={appConfig} onValueChange={handleConfigChange}>
            <SelectTrigger className="w-48" id="config-select">
              <SelectValue placeholder="Select configuration" />
            </SelectTrigger>
            <SelectContent>
              {DEFAULT_CRITERIA_CONFIGS.map((config) => (
                <SelectItem key={config} value={config}>
                  {config}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Criteria Type Selection */}
      <div className="flex p-4 gap-2 flex-wrap">
        <div className="p-2">
          <Label>Available Types:</Label>
        </div>

        {criteriaTypes.map((criteria) => (
          <Button
            key={criteria.name}
            variant={selectedCriteria === criteria.name ? "default" : "outline"}
            size="sm"
            onClick={() => handleSelectCriteria(criteria.name)}
          >
            {criteria.name}
          </Button>
        ))}

        {originalCriteria.map((criteria) => (
          <Button
            key={criteria}
            variant={selectedCriteria === criteria ? "default" : "outline"}
            size="sm"
            className={selectedCriteria === criteria ? "bg-yellow-500" : "border-yellow-500 text-yellow-600"}
            onClick={() => handleSelectCriteria(criteria)}
          >
            {criteria}
          </Button>
        ))}

        <Button
          variant={selectedCriteria === "+" ? "default" : "outline"}
          size="sm"
          className={selectedCriteria === "+" ? "bg-green-500" : "border-green-500 text-green-600"}
          onClick={() => handleSelectCriteria("+")}
        >
          <IconPlus className="h-4 w-4 mr-1" />
          Add New
        </Button>
      </div>

      <Separator />

      {/* Form */}
      <div className="flex flex-col items-center justify-center h-full p-4">
        <form className="w-full max-w-2xl space-y-4" onSubmit={handleSubmit}>
          {/* Type input */}
          <div className="space-y-2">
            <Label htmlFor="type">Type:</Label>
            <Input
              id="type"
              type="text"
              placeholder="synonyms, spelling, etc."
              disabled={selectedCriteria !== "+"}
              required
              maxLength={20}
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
          </div>

          {/* AI Prompt input */}
          {!isDefault(selectedCriteria) && !isOriginal(selectedCriteria) && (
            <div className="space-y-2">
              <Label htmlFor="prompt">AI Prompt:</Label>
              <Input
                id="prompt"
                type="text"
                placeholder="Ex: Add spelling errors to the statement"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={isDefault(selectedCriteria)}
                required
              />
            </div>
          )}

          {/* Test direction radio buttons */}
          {appConfig === "AIBAT" && !isOriginal(selectedCriteria) && (
            <div className="space-y-2">
              <Label>Test Direction:</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="inv"
                    name="testDirection"
                    value="INV"
                    checked={testDirection === "INV"}
                    onChange={(e) => setTestDirection(e.target.value)}
                    disabled={isDefault(selectedCriteria)}
                    required
                  />
                  <Label htmlFor="inv">INV</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="dir"
                    name="testDirection"
                    value="DIR"
                    checked={testDirection === "DIR"}
                    onChange={(e) => setTestDirection(e.target.value)}
                    disabled={isDefault(selectedCriteria) || isOriginal(selectedCriteria)}
                    required
                  />
                  <Label htmlFor="dir">DIR</Label>
                </div>
              </div>
            </div>
          )}

          {/* Testing prompt */}
          {!isDefault(selectedCriteria) && !isOriginal(selectedCriteria) && (
            <div className="space-y-2">
              <Label htmlFor="testPrompt">Test Statement:</Label>
              <Input
                id="testPrompt"
                type="text"
                placeholder="Test Statement"
                value={testStatement}
                onChange={(e) => setTestStatement(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isTestingPrompt}
                  onClick={handleTestPrompt}
                >
                  {isTestingPrompt ? (
                    <IconLoader className="animate-spin h-4 w-4 mr-2" />
                  ) : null}
                  Test Prompt
                </Button>
              </div>
              {testResult && (
                <div className="p-3 border rounded-md bg-muted">
                  <Label className="text-sm font-medium">Test Result:</Label>
                  <p className="text-sm mt-1">{testResult}</p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-4">
            {/* Submit button */}
            {(selectedCriteria === "+" || isOriginal(selectedCriteria)) && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <IconLoader className="animate-spin h-4 w-4 mr-2" />
                ) : null}
                Add New Criteria
              </Button>
            )}

            {/* Edit button */}
            {selectedCriteria !== "+" && !isDefault(selectedCriteria) && !isOriginal(selectedCriteria) && (
              <Button
                type="button"
                disabled={isEditing}
                onClick={handleEdit}
                className="flex-1"
              >
                {isEditing ? (
                  <IconLoader className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <IconEdit className="h-4 w-4 mr-2" />
                )}
                Edit Criteria
              </Button>
            )}

            {/* Delete button */}
            {selectedCriteria !== "+" && !isOriginal(selectedCriteria) && (
              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex-1"
              >
                {isDeleting ? (
                  <IconLoader className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <IconTrash className="h-4 w-4 mr-2" />
                )}
                Remove Criteria
              </Button>
            )}
          </div>

          {isFailedSubmit && (
            <p className="text-red-500 text-sm">Please fill out all required fields</p>
          )}
        </form>
      </div>
    </div>
  )
}