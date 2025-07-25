"use client"

import { useMemo } from "react"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"

import { PerturbationResponse } from "@/types/perturbations"
import { TestData } from "@/types/tests"

interface ChartProps {
  data: TestData[]
  perturbations: Map<string, PerturbationResponse[]>
  topic?: string
}

const chartConfig = {
  approved: {
    label: "Agreement",
    color: "var(--chart-2)",
  },
  denied: {
    label: "Disagreement",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ChartBarPerturbationValidity({
  data = [],
  perturbations = new Map(),
  topic,
}: ChartProps) {
  const chartData = useMemo(() => {
    const result: Array<{
      type: string
      category: "acceptable" | "unacceptable"
      approved: number
      denied: number
    }> = []

    const perturbationsByType = new Map<string, PerturbationResponse[]>()

    data.forEach((test) => {
      const perturbs = perturbations.get(test.id) ?? []
      for (const p of perturbs) {
        if (p.type) {
          if (!perturbationsByType.has(p.type)) {
            perturbationsByType.set(p.type, [])
          }
          perturbationsByType.get(p.type)!.push(p)
        }
      }
    })

    for (const [type, perturbList] of perturbationsByType.entries()) {
      const groups = ["acceptable", "unacceptable"] as const

      for (const gt of groups) {
        const filtered = perturbList.filter((p) => p.ground_truth === gt)
        const approved = filtered.filter(
          (p) => p.validity === "approved"
        ).length
        const denied = filtered.filter((p) => p.validity === "denied").length

        if (approved + denied > 0) {
          result.push({
            type,
            category: gt,
            approved,
            denied,
          })
        }
      }
    }

    return result
  }, [data, perturbations])

  const total = chartData.reduce((sum, d) => sum + d.approved + d.denied, 0)
  const totalApproved = chartData.reduce((sum, d) => sum + d.approved, 0)
  const overallApprovalRate =
    total > 0 ? Math.round((totalApproved / total) * 100) : 0

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="items-center pb-0">
          <CardTitle>Perturbation Validity</CardTitle>
          <CardDescription>
            {topic
              ? `${topic} - No valid perturbation data`
              : "No perturbation data to display"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>No data available</p>
            <p className="text-sm mt-1">
              Generate and validate perturbations to view this chart
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perturbation Validity</CardTitle>
        <CardDescription>
          {topic
            ? `${topic} – Approved vs Denied by ground truth category and type`
            : "Approved vs Denied by ground truth category and type"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[400px] w-full"
        >
          <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid vertical={false} />
            <YAxis
              dataKey="type"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => String(value)}
              interval={0}
            />
            <XAxis type="number" />
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null

                const entry = payload[0].payload
                const label =
                  entry?.category === "acceptable"
                    ? "Acceptable"
                    : "Unacceptable"

                return (
                  <div className="rounded-md border bg-background px-3 py-2 shadow-sm text-sm min-w-[180px]">
                    <div className="font-medium mb-2">{`${label} – ${entry?.type}`}</div>
                    {payload.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 mb-1"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-muted-foreground">
                            {item.name}
                          </span>
                        </div>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </div>
                )
              }}
            />

            <Bar
              dataKey="denied"
              stackId="a"
              fill="var(--color-denied)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="approved"
              stackId="a"
              fill="var(--color-approved)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-center gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {overallApprovalRate}% overall approval{" "}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing {total} validated perturbation evaluations
        </div>
      </CardFooter>
    </Card>
  )
}
