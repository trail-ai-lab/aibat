"use client"

import { useEffect, useState } from "react"
import { fetchDefaultCriteria, type DefaultCriteriaItem } from "@/lib/api/criteria"

let cachedCriteriaConfigs: DefaultCriteriaItem[] | null = null

export function useCriteria() {
  const [criteriaConfigs, setCriteriaConfigs] = useState<DefaultCriteriaItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (cachedCriteriaConfigs) {
        setCriteriaConfigs(cachedCriteriaConfigs)
        setLoading(false)
        return
      }

      try {
        const data = await fetchDefaultCriteria()
        cachedCriteriaConfigs = data
        setCriteriaConfigs(data)
      } catch (err) {
        console.error("Error fetching default criteria", err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return { criteriaConfigs, loading }
}
