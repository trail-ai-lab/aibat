// components/dashboard/dashboard-empty.tsx
import { IconDatabase } from "@tabler/icons-react"

export function DashboardEmpty() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <IconDatabase className="size-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-xl font-medium mb-2">Welcome to AIBAT</p>
        <p className="text-muted-foreground">
          Select a topic from the sidebar to view test statements and assessments
        </p>
      </div>
    </div>
  )
}
