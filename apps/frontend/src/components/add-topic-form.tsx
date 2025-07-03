"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { IconLoader } from "@tabler/icons-react"
import { createTopic, type CreateTopicRequest } from "@/lib/api/tests"
import { toast } from "sonner"

type AddTopicFormProps = {
  onClose: () => void
  onSuccess: () => void
}

export function AddTopicForm({ onClose, onSuccess }: AddTopicFormProps) {
  const [shorthandTopic, setShorthandTopic] = useState("")
  const [topic, setTopic] = useState("")
  const [prompt, setPrompt] = useState("")
  const [isDefaultGradingPrompt, setIsDefaultGradingPrompt] = useState(true)

  // Array of tests and ground truths
  const [tests, setTests] = useState(Array(10).fill(""))
  const [groundTruths, setGroundTruths] = useState(Array(10).fill(""))

  const [isAddingTopic, setIsAddingTopic] = useState(false)
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

  const handleAddTopic = async () => {
    setIsAddingTopic(true)
    setSubmitErrorMsg("")
    
    const _name = shorthandTopic.trim()
    const _prompt = prompt.trim()
    
    if (_name === "" || _prompt === "" || tests.every((test) => test === "")) {
      // Create error message
      let errorMsg = "Please enter "
      if (_name === "" || _prompt === "")
        errorMsg += "a topic name and prompt "
      if (tests.every((test) => test === ""))
        errorMsg += `${_name === "" ? "and" : ""} at least one test`
      setSubmitErrorMsg(errorMsg)
      setIsAddingTopic(false)
      return
    }

    const testData = []

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i].trim()
      if (test !== "") {
        if (groundTruths[i] === "") {
          setSubmitErrorMsg("Please select the ground truth for each test")
          setIsAddingTopic(false)
          return
        }
        testData.push({
          test: test,
          ground_truth: groundTruths[i] as "acceptable" | "unacceptable",
        })
      }
    }

    const topicData: CreateTopicRequest = {
      topic: _name,
      prompt_topic: _prompt,
      tests: testData,
    }

    try {
      await createTopic(topicData)
      toast.success(`Topic "${_name}" created successfully!`)
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      setSubmitErrorMsg(error instanceof Error ? error.message : "Failed to add topic")
    } finally {
      setIsAddingTopic(false)
    }
  }

  // Reset grading prompt on checkbox change
  useEffect(() => {
    if (isDefaultGradingPrompt) {
      setPrompt(`Is this sentence an acceptable or unacceptable statement about ${topic || "{topic}"}? Here is the sentence:`)
    } else {
      setPrompt("")
    }
  }, [isDefaultGradingPrompt, topic])

  const onTopicChange = (newTopic: string) => {
    setTopic(newTopic)
    if (isDefaultGradingPrompt) {
      setPrompt(`Is this sentence an acceptable or unacceptable statement about ${newTopic || "{topic}"}? Here is the sentence:`)
    }
  }

  return (
    <div className="w-full flex flex-col max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="text-2xl p-4 font-light w-full text-center border-b">
        Add New Topic
      </div>

      <div className="flex flex-col items-center justify-center h-full">
        <div className="px-8 py-6 mb-4 w-full space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-sm font-bold">
              Topic:
            </Label>
            <Input
              id="topic"
              type="text"
              placeholder="e.g., Physics Energy Concepts"
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
              className="w-2/5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shorthand" className="text-sm font-bold">
              Shorthand Topic (10 characters max):
            </Label>
            <Input
              id="shorthand"
              type="text"
              placeholder="e.g., ENERGY"
              maxLength={10}
              value={shorthandTopic}
              onChange={(e) => setShorthandTopic(e.target.value)}
              className="w-2/5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-sm font-bold">
              Assessment Prompt:
            </Label>
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="default-prompt"
                checked={isDefaultGradingPrompt}
                onCheckedChange={(checked) => setIsDefaultGradingPrompt(checked === true)}
              />
              <Label htmlFor="default-prompt" className="text-sm font-normal">
                Use default prompt
              </Label>
            </div>
            <Input
              id="prompt"
              type="text"
              placeholder="i.e. The following tests describe the concept of {topic}"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-4/5"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold">
              Tests:
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
            {isAddingTopic ? (
              <Button disabled className="w-32">
                <IconLoader className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </Button>
            ) : (
              <Button onClick={handleAddTopic} className="w-32">
                Add Topic
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
    </div>
  )
}