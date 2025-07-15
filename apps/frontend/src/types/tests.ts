interface TestData {
  id: string
  statement: string
  ground_truth: "acceptable" | "unacceptable" | "ungraded"
  ai_assessment: "pass" | "fail" | "grading"
  agreement: boolean | null
  topic: string
}
