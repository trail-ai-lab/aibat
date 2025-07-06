"use client"

import { IconDots, IconFolder, IconShare3, IconTrash, IconDatabase } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import type { Topic } from "@/hooks/use-topics"

export function NavTopics({
  topics,
  onTopicSelect,
  selectedTopic
}: {
  topics: Topic[]
  onTopicSelect?: (topic: string) => void
  selectedTopic?: string | null
}) {
  const { isMobile } = useSidebar()

  const renderItem = (topic: Topic) => {
    const Icon = topic.icon || IconDatabase
    const isSelected = selectedTopic === topic.name
    return (
      <SidebarMenuItem key={topic.name}>
        <SidebarMenuButton asChild isActive={isSelected}>
          <button
            onClick={() => onTopicSelect?.(topic.name)}
            className="flex items-center gap-2 w-full text-left justify-between"
          >
            <div className="flex items-center gap-2">
              <Icon />
              <span>{topic.name}</span>
            </div>
            {topic.isBuiltin && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                Default
              </Badge>
            )}
          </button>
        </SidebarMenuButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction
              showOnHover
              className="data-[state=open]:bg-accent rounded-sm"
            >
              <IconDots />
              <span className="sr-only">More</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-24 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align={isMobile ? "end" : "start"}
          >
            <DropdownMenuItem>
              <IconFolder />
              <span>Open</span>
            </DropdownMenuItem>
            {!topic.isBuiltin && (
              <>
                <DropdownMenuItem>
                  <IconShare3 />
                  <span>Share</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <IconTrash />
                  <span>Delete</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Topics</SidebarGroupLabel>
      <SidebarMenu>
        {topics.length > 0 ? (
          topics.map(renderItem)
        ) : (
          <SidebarMenuItem>
            <SidebarMenuButton disabled>No topics found</SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
