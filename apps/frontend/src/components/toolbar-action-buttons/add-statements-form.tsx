// apps/frontend/src/components/add-statements-form.tsx

"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconLoader } from "@tabler/icons-react"
import { addStatementsToTopic, type AddStatementsRequest } from "@/lib/api/tests"
import { toast } from "sonner"

type AddStatementsFormProps = {
  topicName: string
  onClose: () => void
  onSuccess: () => void
}

export function AddStatementsForm({ topicName, onClose, onSuccess }: AddStatementsFormProps) {
  // Array of tests and ground truths
  const [tests, setTests] = useState(Array(10).fill(""))
  const [groundTruths, setGroundTruths] = useState(Array(10).fill(""))

  const [isAddingStatements, setIsAddingStatements] = useState(false)
  const [submitErrorMsg, setSubmitErrorMsg] = useState("")

  const onTestChange = (index: number, value: string) => {
    const newTests = [...tests]
    newTests[index] = value
    setTests(newTests)
  }

  const onCorrectnessChange = (index: number, value: string) => {
    const newGroundTruths = [...groundTruths]
    newGroundTruths[index] = value
    setGroundTruths(newGroundTruths)
  }

  const handleAddStatements = async () => {
    setIsAddingStatements(true)
    setSubmitErrorMsg("")
    
    if (tests.every((test) => test === "")) {
      setSubmitErrorMsg("Please enter at least one test statement")
      setIsAddingStatements(false)
      return
    }

    const testData = []

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i].trim()
      if (test !== "") {
        if (groundTruths[i] === "") {
          setSubmitErrorMsg("Please select the ground truth for each test statement")
          setIsAddingStatements(false)
          return
        }
        testData.push({
          test: test,
          ground_truth: groundTruths[i] as "acceptable" | "unacceptable",
        })
      }
    }

    const statementsData: AddStatementsRequest = {
      topic: topicName,
      tests: testData,
    }

    try {
      const result = await addStatementsToTopic(statementsData)
      toast.success(`Successfully added ${testData.length} statements to "${topicName}"!`)
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      setSubmitErrorMsg(error instanceof Error ? error.message : "Failed to add statements")
    } finally {
      setIsAddingStatements(false)
    }
  }

  return (
    <div className="w-full flex flex-col max-h-[70vh] overflow-y-auto">
      <div className="px-6 py-4 w-full space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-bold">
            Test Statements:
          </Label>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  type="text"
                  placeholder={`Test statement ${i + 1}`}
                  value={tests[i]}
                  onChange={(e) => onTestChange(i, e.target.value)}
                  className="flex-1"
                />
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`acceptable-${i}`}
                      name={`ground-truth-${i}`}
                      value="acceptable"
                      checked={groundTruths[i] === "acceptable"}
                      onChange={(e) => onCorrectnessChange(i, e.target.value)}
                      className="form-radio"
                    />
                    <Label htmlFor={`acceptable-${i}`} className="text-sm">
                      Acceptable
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`unacceptable-${i}`}
                      name={`ground-truth-${i}`}
                      value="unacceptable"
                      checked={groundTruths[i] === "unacceptable"}
                      onChange={(e) => onCorrectnessChange(i, e.target.value)}
                      className="form-radio"
                    />
                    <Label htmlFor={`unacceptable-${i}`} className="text-sm">
                      Unacceptable
                    </Label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4">
          {isAddingStatements ? (
            <Button disabled className="w-32">
              <IconLoader className="w-4 h-4 mr-2 animate-spin" />
              Adding...
            </Button>
          ) : (
            <Button onClick={handleAddStatements} className="w-32">
              Add Statements
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