"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts"

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

export const description = "A vertical grouped bar chart"

const chartData = [
  { browser: "chrome", desktop: 275, mobile: 180 },
  { browser: "safari", desktop: 200, mobile: 120 },
  { browser: "firefox", desktop: 187, mobile: 95 },
  { browser: "edge", desktop: 173, mobile: 80 },
  { browser: "other", desktop: 90, mobile: 60 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ChartBarGroupedVertical() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Grouped Vertical</CardTitle>
        <CardDescription>Device Usage by Browser</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 0 }}>
            <CartesianGrid vertical={false} />
            <YAxis
              dataKey="browser"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                const str = String(value)
                return str.charAt(0).toUpperCase() + str.slice(1)
              }}
            />
            <XAxis type="number" />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing device usage by browser
        </div>
      </CardFooter>
    </Card>
  )
}
