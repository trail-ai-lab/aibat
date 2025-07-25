// apps/frontend/src/components/app-sidebar.tsx

"use client"

import * as React from "react"
import { useState } from "react"
import { IconSettings, IconHelp } from "@tabler/icons-react"
import Image from "next/image"

import { NavTopics } from "@/components/sidebar-nav/nav-topics"
import { NavMain } from "@/components/sidebar-nav/nav-main"
import { NavSecondary } from "@/components/sidebar-nav/nav-secondary"
import { NavUser } from "@/components/sidebar-nav/nav-user"
import { SettingsDrawer } from "@/components/sidebar-nav/settings-drawer"
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
import { Skeleton } from "@/components/ui/skeleton"

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
  onEditTopic?: (
    oldName: string,
    newName: string,
    prompt: string
  ) => Promise<void>
  selectedTopic?: string | null
  topics: Topic[]
  loading?: boolean
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
                <Image
                  src="/logo/trail-logo.svg"
                  alt="TRAIL Logo"
                  width={24}
                  height={24}
                  priority
                  className="invert-0 dark:invert"
                />
                <span className="text-base font-semibold">AIBAT</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain onCreateTopic={onCreateTopic} />

        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        ) : (
          <NavTopics
            topics={topics}
            onTopicSelect={onTopicSelect}
            selectedTopic={selectedTopic}
            onDeleteTopic={onDeleteTopic}
            onEditTopic={onEditTopic}
          />
        )}

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
