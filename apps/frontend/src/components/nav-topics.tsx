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
import type { Topic } from "@/hooks/use-topics"

export function NavDocuments({ topics }: { topics: Topic[] }) {
  const { isMobile } = useSidebar()

  const renderItem = (topic: Topic) => {
    const Icon = topic.icon || IconDatabase
    return (
      <SidebarMenuItem key={topic.name}>
        <SidebarMenuButton asChild>
          <a href={topic.url}>
            <Icon />
            <span>{topic.name}</span>
          </a>
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
            <DropdownMenuItem>
              <IconShare3 />
              <span>Share</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <IconTrash />
              <span>Delete</span>
            </DropdownMenuItem>
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
