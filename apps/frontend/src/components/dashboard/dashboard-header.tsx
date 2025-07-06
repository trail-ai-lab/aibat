// components/dashboard/dashboard-header.tsx
import { Badge } from "@/components/ui/badge"
import { IconDatabase } from "@tabler/icons-react"

interface Props {
  topic: string | null
  totalTests: number
  topicPrompt: string | null
}

export function DashboardHeader({ topic, totalTests, topicPrompt }: Props) {
  return (
    <div className="flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <IconDatabase className="size-6" />
        <div>
          <h1 className="text-2xl font-semibold">
            {topic ? `${topic} Tests` : "Select a Topic"}
          </h1>
          <p className="text-muted-foreground">
            {topic
              ? `Showing ${totalTests} test statements for ${topic}`
              : "Choose a topic from the sidebar to view test statements"}
          </p>
          {topic && topicPrompt && (
            <div className="mt-3">
              <div className="bg-muted/50 rounded-lg p-3 border-l-4 border-primary">
                <p className="text-sm font-medium text-foreground mb-1">Topic Prompt:</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{topicPrompt}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      {topic && (
        <Badge variant="secondary" className="px-3 py-1">
          {totalTests} tests
        </Badge>
      )}
    </div>
  )
}
