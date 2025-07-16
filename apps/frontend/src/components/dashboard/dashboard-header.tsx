// components/dashboard/dashboard-header.tsx
import { IconQuote } from "@tabler/icons-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Props {
  topic: string | null
  totalTests: number
  topicPrompt: string | null
}

export function DashboardHeader({ topic, topicPrompt }: Props) {
  return (
    <div className="px-4 lg:px-6">
      {topic && topicPrompt && (
        <Alert>
          <IconQuote className="h-4 w-4" />
          <AlertTitle>Prompt</AlertTitle>
          <AlertDescription>{topicPrompt}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
