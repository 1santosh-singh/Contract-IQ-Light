"use client"

import { useState } from "react"
import { 
  FileText, 
  MessageSquare, 
  Settings, 
  TrendingUp, 
  Users, 
  FolderOpen,
  Menu,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"

interface SidebarProps {
  className?: string
}

const menuItems = [
  { icon: FileText, label: "Dashboard", href: "/" },
  { icon: TrendingUp, label: "Components", href: "/components" },
  { icon: FileText, label: "Contracts", href: "/contracts" },
  { icon: MessageSquare, label: "AI Chat", href: "/chat" },
  { icon: TrendingUp, label: "Analytics", href: "/analytics" },
  { icon: Users, label: "Team", href: "/team" },
  { icon: FolderOpen, label: "Documents", href: "/documents" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const toggleCollapse = () => setIsCollapsed(!isCollapsed)

  return (
    <>
      {/* Mobile Sidebar Trigger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-white/10 backdrop-blur-md border-r border-white/20 shadow-lg w-80 p-0">
            <SheetHeader className="border-b border-white/10">
              <SheetTitle className="px-4 pt-4">Navigation</SheetTitle>
              <SheetDescription className="px-4 pb-3">Quick access menu</SheetDescription>
            </SheetHeader>
            <SidebarContent isCollapsed={false} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 h-full z-40 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          className
        )}
      >
        <div className="bg-white/10 backdrop-blur-md border-r border-white/20 shadow-lg h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            {!isCollapsed && (
              <h1 className="text-xl font-bold text-sidebar-foreground">
                Contract IQ
              </h1>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="ml-auto hover:bg-sidebar-accent"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                  isCollapsed && "justify-center"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </a>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <div className={cn(
              "flex items-center gap-3",
              isCollapsed && "justify-center"
            )}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 grid place-items-center text-white text-xs font-semibold">
                JD
              </div>
              {!isCollapsed && (
                <div className="flex-1">
                  <p className="text-sm font-medium text-sidebar-foreground">John Doe</p>
                  <p className="text-xs text-sidebar-accent-foreground">john@example.com</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

function SidebarContent({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-sidebar-foreground">
            Contract IQ
          </h1>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
              isCollapsed && "justify-center"
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </a>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3",
          isCollapsed && "justify-center"
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 grid place-items-center text-white text-xs font-semibold">
            JD
          </div>
          {!isCollapsed && (
            <div className="flex-1">
              <p className="text-sm font-medium text-sidebar-foreground">John Doe</p>
              <p className="text-xs text-sidebar-accent-foreground">john@example.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
