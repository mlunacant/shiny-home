"use client"

import { useState } from "react"
import { NavMenu } from "@/components/nav-menu"
import { useAuth } from "@/lib/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { logOut } from "@/lib/firebase/firebaseUtils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = async () => {
    try {
      await logOut()
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  return (
    <div className="flex min-h-screen">
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
      <div className="flex-1">
        <header className="flex justify-end items-center p-4 border-b">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{user?.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
} 