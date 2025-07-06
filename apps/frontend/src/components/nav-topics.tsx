// apps/frontend/src/components/nav-topics.tsx

"use client"

import {
  IconDots,
  IconTrash,
  IconDatabase,
  IconPencil,
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Topic } from "@/types/topics"
import { toast } from "sonner"
import { useState } from "react"

export function NavTopics({
  topics,
  onTopicSelect,
  selectedTopic,
  onDeleteTopic,
  onEditTopic,
}: {
  topics: Topic[]
  onTopicSelect?: (topic: string) => void
  selectedTopic?: string | null
  onDeleteTopic?: (topicName: string) => void
  onEditTopic?: (oldName: string, newName: string, prompt: string) => Promise<void>
}) {
  const { isMobile } = useSidebar()

  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [newName, setNewName] = useState("")
  const [newPrompt, setNewPrompt] = useState("")

  const openEditDrawer = (topic: Topic) => {
    setEditingTopic(topic)
    setNewName(topic.name)
    setNewPrompt(topic.prompt)
  }

  const handleEditSave = async () => {
    if (!editingTopic || !onEditTopic) return
    try {
      await onEditTopic(editingTopic.name, newName, newPrompt)
      toast.success(`Updated topic: ${newName}`)
      setEditingTopic(null)
    } catch (err) {
      console.error(err)
      toast.error("Failed to update topic")
    }
  }

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
            className="w-32 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align={isMobile ? "end" : "start"}
          >
            <DropdownMenuItem onClick={() => openEditDrawer(topic)}>
              <IconPencil />
              <span>Edit</span>
            </DropdownMenuItem>
            {!topic.isBuiltin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => handleDelete(topic)}
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
    <>
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

      {/* 🔽 Edit Drawer */}
      <Drawer open={!!editingTopic} onOpenChange={(open) => !open && setEditingTopic(null)}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Edit Topic</DrawerTitle>
            <DrawerDescription>Update the topic name and prompt.</DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-4 px-4 py-2">
            <div className="grid w-full max-w-sm items-center gap-3">
              <Label htmlFor="topic-name">Topic Name</Label>
              <Input
                id="topic-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="grid w-full max-w-sm items-center gap-3">
              <Label htmlFor="topic-prompt">Prompt</Label>
              <Input
                id="topic-prompt"
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
              />
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleEditSave}>Save Changes</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
