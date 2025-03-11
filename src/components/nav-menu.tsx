"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Settings, Languages, ChevronLeft, ChevronRight } from "lucide-react"
import { useI18n } from "@/lib/i18n"

interface NavMenuProps {
  onCollapse: (collapsed: boolean) => void
}

export function NavMenu({ onCollapse }: NavMenuProps) {
  const pathname = usePathname()
  const { t, lang, setLang } = useI18n()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Check viewport width on mount and when window resizes
  useEffect(() => {
    const checkWidth = () => {
      if (window.innerWidth < 768) { // md breakpoint
        setIsCollapsed(true)
      }
    }

    // Check on mount
    checkWidth()

    // Add resize listener
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  // Sync collapse state with parent
  useEffect(() => {
    onCollapse(isCollapsed)
  }, [isCollapsed, onCollapse])

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'es' : 'en')
  }

  const menuItems = [
    {
      title: t.common.dashboard,
      href: "/",
      icon: LayoutDashboard,
    },
    {
      title: t.common.rooms,
      href: "/setup",
      icon: Settings,
    },
  ]

  return (
    <div className={cn(
      "relative transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-2 z-20 h-8 w-8 rounded-full border bg-background"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      <div className="space-y-6">
        <Button
          variant="outline"
          className={cn(
            "w-full flex items-center",
            isCollapsed ? "justify-center px-2" : "justify-start gap-2"
          )}
          onClick={toggleLanguage}
          title={isCollapsed ? (lang === 'en' ? 'English' : 'Español') : undefined}
        >
          <Languages className="h-4 w-4" />
          {!isCollapsed && (
            <span className="capitalize">{lang === 'en' ? 'English' : 'Español'}</span>
          )}
        </Button>

        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full",
                  isCollapsed ? "justify-center px-2" : "justify-start",
                  pathname === item.href && "bg-muted"
                )}
                asChild
                title={isCollapsed ? item.title : undefined}
              >
                <Link href={item.href}>
                  <Icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                  {!isCollapsed && item.title}
                </Link>
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
} 