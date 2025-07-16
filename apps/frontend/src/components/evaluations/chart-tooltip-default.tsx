"use client"

import { useMemo } from "react"
import { Bar, BarChart, XAxis } from "recharts"
import { TrendingUp } from "lucide-react"

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
import { TestData } from "@/types/tests"

export const description =
  "A stacked bar chart showing agreement by ground truth category"

interface ChartTooltipDefaultProps {
  data?: TestData[]
  topic?: string
}

const chartConfig = {
  match: {
    label: "Agreement",
    color: "var(--chart-2)",
  },
  mismatch: {
    label: "Disagreement",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ChartTooltipDefault({
  data = [],
  topic,
}: ChartTooltipDefaultProps) {
  const chartData = useMemo(() => {
    const graded = data.filter((test) => test.agreement !== null)

    if (graded.length === 0) return []

    // Group by ground_truth and count agreements/disagreements
    const acceptable = graded.filter((t) => t.ground_truth === "acceptable")
    const unacceptable = graded.filter((t) => t.ground_truth === "unacceptable")

    const acceptableMatch = acceptable.filter(
      (t) => t.agreement === true
    ).length
    const acceptableMismatch = acceptable.filter(
      (t) => t.agreement === false
    ).length
    const unacceptableMatch = unacceptable.filter(
      (t) => t.agreement === true
    ).length
    const unacceptableMismatch = unacceptable.filter(
      (t) => t.agreement === false
    ).length

    const result = []

    if (acceptable.length > 0) {
      result.push({
        category: "Acceptable",
        match: acceptableMatch,
        mismatch: acceptableMismatch,
      })
    }

    if (unacceptable.length > 0) {
      result.push({
        category: "Unacceptable",
        match: unacceptableMatch,
        mismatch: unacceptableMismatch,
      })
    }

    return result
  }, [data])

  const totalGraded = data.filter((test) => test.agreement !== null).length
  const totalMatch = chartData.reduce((sum, item) => sum + item.match, 0)
  const overallMatchPercent =
    totalGraded > 0 ? Math.round((totalMatch / totalGraded) * 100) : 0

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="items-center pb-0">
          <CardTitle>Agreement by Category</CardTitle>
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
    <Card>
      <CardHeader>
        <CardTitle>Agreement by Category</CardTitle>
        <CardDescription>
          {topic
            ? `${topic} - Agreement breakdown by ground truth category`
            : "Agreement breakdown by ground truth category"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <BarChart accessibilityLayer data={chartData}>
            <XAxis
              dataKey="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <Bar
              dataKey="match"
              stackId="a"
              fill="var(--color-match)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="mismatch"
              stackId="a"
              fill="var(--color-mismatch)"
              radius={[4, 4, 0, 0]}
            />
            <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          {overallMatchPercent}% overall agreement rate{" "}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing agreement for {totalGraded} graded test statements
        </div>
      </CardFooter>
    </Card>
  )
}
