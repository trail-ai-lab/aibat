// src/types/perturbations.ts

export interface PerturbationResponse {
  agreement: boolean
  id: string
  original_id: string
  title: string
  label: "pass" | "fail"
  type: string
  topic: string
  ground_truth: "acceptable" | "unacceptable"
  validity: "approved" | "denied" | "unapproved"
}
