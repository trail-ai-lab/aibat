// src/components/data-table/schema.ts
import { z } from "zod"

export const schema = z.object({
  id: z.string(),
  statement: z.string(),
  ground_truth: z.enum(["acceptable", "unacceptable", "ungraded"]),
  ai_assessment: z.enum(["pass", "fail", "grading"]),
  agreement: z.boolean().nullable(),
  topic: z.string(),
  labeler: z.string().optional(),
  description: z.string().optional(),
  author: z.string().optional(),
  model_score: z.string().optional(),
  is_builtin: z.boolean().optional(),
  parent_id: z.string().optional(),
  criteria_text: z.string().optional(),
  perturbation_type: z.string().optional(),
})
