// apps/frontend/src/components/site-header.tsx

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "./model-toggle"

export function SiteHeader({
  topicName,
  testsCount,
}: {
  topicName?: string
  testsCount?: number
}) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex items-center gap-2">
          <h1 className="text-base font-medium">
            {topicName ? `${topicName}` : "Where You and AI (Dis)Agree"}
          </h1>
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          {topicName && testsCount !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {testsCount} {testsCount === 1 ? "test" : "tests"}
            </Badge>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://trail.wcer.wisc.edu/"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              TRAIL Lab
            </a>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
