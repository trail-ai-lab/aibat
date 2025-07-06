// apps/frontend/src/components/nav-topics.tsx

"use client"

import {
  IconDots,
  IconFolder,
  IconTrash,
  IconDatabase,
} from "@tabler/icons-react"
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
import { Topic } from "@/types/topics"
import { toast } from "sonner"

export function NavTopics({
  topics,
  onTopicSelect,
  selectedTopic,
  onDeleteTopic, // (topicName: string) => void
}: {
  topics: Topic[]
  onTopicSelect?: (topic: string) => void
  selectedTopic?: string | null
  onDeleteTopic?: (topicName: string) => void
}) {
  const { isMobile } = useSidebar()

  const handleDelete = async (topic: Topic) => {
    try {
      await onDeleteTopic?.(topic.name)
      toast.success(`Deleted topic: ${topic.name}`)
    } catch (err) {
      console.error(err)
      toast.error(`Failed to delete topic: ${topic.name}`)
    }
  }

  const renderItem = (topic: Topic) => {
    const Icon = topic.icon || IconDatabase
    const isSelected = selectedTopic === topic.name

    return (
      <SidebarMenuItem key={topic.name}>
        <SidebarMenuButton
          asChild
          isActive={isSelected}
          className={isSelected ? "bg-accent text-accent-foreground hover:bg-accent/80" : ""}
        >
          <button
            onClick={() => onTopicSelect?.(topic.name)}
            className="flex items-center gap-2 w-full text-left justify-between px-2 py-1.5 rounded-md"
          >
            <div className="flex items-center gap-2">
              <Icon className="size-4" />
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
              <span>Rename</span>
            </DropdownMenuItem>
            {!topic.isBuiltin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => handleDelete(topic)} // ✅ triggers passed-in prop
                >
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
