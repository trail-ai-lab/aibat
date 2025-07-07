// apps/frontend/src/components/app-sidebar.tsx

"use client"

import * as React from "react"
import { useState } from "react"
import {
  IconSettings,
  IconHelp,
  IconSearch,
  IconInnerShadowTop,
} from "@tabler/icons-react"

import { NavTopics } from "@/components/nav-topics"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { SettingsDrawer } from "@/components/settings-drawer"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Topic } from "@/types/topics"

export function AppSidebar({
  onTopicSelect,
  onCreateTopic,
  onDeleteTopic,
  onEditTopic,
  selectedTopic,
  topics,
  loading,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  onTopicSelect?: (topic: string) => void
  onCreateTopic?: () => void
  onDeleteTopic?: (topic: string) => void
  onEditTopic?: (oldName: string, newName: string, prompt: string) => Promise<void>
  selectedTopic?: string | null
  topics: Topic[]
  loading: boolean
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const navSecondary = [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
      onClick: () => setIsSettingsOpen(true),
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
  ]
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">AIBAT</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain onCreateTopic={onCreateTopic} />
        <NavTopics
          topics={topics}
          onTopicSelect={onTopicSelect}
          selectedTopic={selectedTopic}
          onDeleteTopic={onDeleteTopic}
          onEditTopic={onEditTopic}
        />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SettingsDrawer
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        currentTopic={selectedTopic || undefined}
      />
    </Sidebar>
  )
}
