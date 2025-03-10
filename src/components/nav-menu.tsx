"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Settings, Languages } from "lucide-react"
import { useI18n } from "@/lib/i18n"

export function NavMenu() {
  const pathname = usePathname()
  const { t, lang, setLang } = useI18n()

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
    <div className="space-y-6">
      <Button
        variant="outline"
        className="w-full flex items-center justify-start gap-2"
        onClick={toggleLanguage}
      >
        <Languages className="h-4 w-4" />
        <span className="capitalize">{lang === 'en' ? 'English' : 'Español'}</span>
      </Button>

      <div className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                pathname === item.href && "bg-muted"
              )}
              asChild
            >
              <Link href={item.href}>
                <Icon className="mr-2 h-4 w-4" />
                {item.title}
              </Link>
            </Button>
          )
        })}
      </div>
    </div>
  )
} 