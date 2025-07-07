export interface DefaultCriteriaItem {
  config: string
  types: {
    name: string
    prompt: string
  }[]
}

export interface CriteriaTypeInput {
  name: string
  prompt: string
  isDefault: boolean
}

export interface CriteriaType {
  name: string
  prompt: string
  isDefault: boolean
}