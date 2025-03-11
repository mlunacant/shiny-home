"use client"

import { useState } from "react"
import { NavMenu } from "@/components/nav-menu"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="flex h-screen">
      {/* Left sidebar */}
      <div className={`transition-all duration-300 border-r bg-muted/50 p-6 ${isCollapsed ? "w-[88px]" : "w-[280px]"}`}>
        <div className={`flex items-center mb-8 ${isCollapsed ? "justify-center" : ""}`}>
          <h1 className={`font-bold ${isCollapsed ? "text-lg" : "text-xl"}`}>
            {isCollapsed ? "SH" : "Shiny Home"}
          </h1>
        </div>
        <NavMenu onCollapse={setIsCollapsed} />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="container py-6">
          {children}
        </div>
      </div>
    </div>
  )
} 