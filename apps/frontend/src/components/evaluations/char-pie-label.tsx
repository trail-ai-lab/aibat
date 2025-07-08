"use client"

import { useMemo } from "react"
import { TrendingUp } from "lucide-react"
import { PieChart, Pie, Cell } from "recharts"

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
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description =
  "A pie chart showing agreement between AI and human assessments"

interface TestData {
  id: string
  statement: string
  ground_truth: "acceptable" | "unacceptable" | "ungraded"
  ai_assessment: "pass" | "fail" | "grading"
  agreement: boolean | null
  topic: string
}

interface ChartPieLabelProps {
  data?: TestData[]
  topic?: string
}

const chartConfig = {
  count: {
    label: "Count",
  },
  match: {
    label: "Match",
    color: "var(--chart-2)",
  },
  mismatch: {
    label: "Mismatch",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ChartPieLabel({ data = [], topic }: ChartPieLabelProps) {
  const chartData = useMemo(() => {
    const graded = data.filter((test) => test.agreement !== null)
    console.log(data)

    if (graded.length === 0) return []

    const matchCount = graded.filter((t) => t.agreement === true).length
    const mismatchCount = graded.filter((t) => t.agreement === false).length

    return [
      { category: "match", count: matchCount },
      { category: "mismatch", count: mismatchCount },
    ].filter((item) => item.count > 0)
  }, [data])

  const total = chartData.reduce((sum, item) => sum + item.count, 0)
  const matchPercent =
    total > 0
      ? Math.round(
          ((chartData.find((d) => d.category === "match")?.count || 0) /
            total) *
            100
        )
      : 0

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="items-center pb-0">
          <CardTitle>Agreement Analysis</CardTitle>
          <CardDescription>
            {topic
              ? `${topic} - No graded statements`
              : "No graded statements available"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>No graded test statements to analyze</p>
            <p className="text-sm mt-1">
              Grade some statements to see agreement data
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Agreement Analysis</CardTitle>
        <CardDescription>
          {topic
            ? `${topic} - AI vs Human Assessment`
            : "AI vs Human Assessment Agreement"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px] pb-0"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={chartData} dataKey="count" label nameKey="category">
              <Cell fill="var(--chart-2)" />
              <Cell fill="var(--chart-1)" />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          {matchPercent}% agreement rate <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing agreement for {total} graded test statements
        </div>
      </CardFooter>
    </Card>
  )
}
