"use client"

import { NavMenu } from "@/components/nav-menu"

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Left sidebar */}
      <div className="w-64 border-r bg-muted/50 p-6">
        <div className="flex items-center mb-8">
          <h1 className="text-xl font-bold">Shiny Home</h1>
        </div>
        <NavMenu />
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