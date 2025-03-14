"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, Clock, ChevronUp, ChevronDown, Calendar } from "lucide-react"
import { toast } from "sonner"
import type { Task, Room } from "@/lib/types"
import { useI18n, replaceParams } from "@/lib/i18n"
import { useAuth } from "@/lib/contexts/AuthContext"
import { getRooms, getTasks, updateTask } from "@/lib/firebase/firebaseUtils"

export default function Dashboard() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showNextWeekTasks, setShowNextWeekTasks] = useState(false)
  const [showNeedingAttention, setShowNeedingAttention] = useState(true)
  const [showTodayTasks, setShowTodayTasks] = useState(true)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  useEffect(() => {
    const loadData = async () => {
      if (!user?.email) return
      
      try {
        setLoading(true)
        const [roomsData, tasksData] = await Promise.all([
          getRooms(user.email),
          getTasks(user.email)
        ])
        setRooms(roomsData)
        setTasks(tasksData)
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error(t.validation.error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.email])

  // Filter tasks by current user
  const userTasks = tasks.filter(task => task.userId === user?.email)

  const getPeriodicityLabel = (periodicity: { value: number, unit: "days" | "weeks" | "months" }): string => {
    const unit = t.frequency[periodicity.unit]
    return replaceParams(t.frequency.every, { value: periodicity.value, unit: unit.toLowerCase() })
  }

  const getRoomName = (roomId: string): string => {
    const room = rooms.find((r) => r.id === roomId)
    return room ? room.name : "Unknown Room"
  }

  const getRoomColor = (roomId: string): string => {
    const room = rooms.find((r) => r.id === roomId)
    return room ? room.color : "#000000"
  }

  const getWeekBounds = (date: Date): { start: Date; end: Date } => {
    const start = new Date(date)
    // Get Monday (1) of current week. If today is Sunday (0), go back 6 days
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1)
    start.setDate(diff)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 6) // End of week (Sunday)
    end.setHours(23, 59, 59, 999)

    return { start, end }
  }

  const getNextWeekBounds = (date: Date): { start: Date; end: Date } => {
    const thisWeek = getWeekBounds(date)
    const nextWeekStart = new Date(thisWeek.end)
    nextWeekStart.setDate(nextWeekStart.getDate() + 1)
    nextWeekStart.setHours(0, 0, 0, 0)
    
    const nextWeekEnd = new Date(nextWeekStart)
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6)
    nextWeekEnd.setHours(23, 59, 59, 999)

    return { start: nextWeekStart, end: nextWeekEnd }
  }

  const getTasksDueThisWeek = () => {
    const now = new Date()
    const { start, end } = getWeekBounds(now)
    
    return userTasks.filter(task => {
      const dueDate = new Date(task.nextDue)
      // Include tasks that are either overdue or due this week
      return dueDate <= end && (dueDate < start ? !task.lastCompleted : true)
    })
  }

  const getTasksDueNextWeek = () => {
    const now = new Date()
    const { start, end } = getNextWeekBounds(now)
    
    return userTasks.filter(task => {
      const dueDate = new Date(task.nextDue)
      return dueDate >= start && dueDate <= end
    }).sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime())
  }

  const getTasksDueToday = () => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    return userTasks.filter(task => {
      const dueDate = new Date(task.nextDue)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate.getTime() === now.getTime()
    })
  }

  const handleMarkComplete = async (task: Task) => {
    if (!user?.email) return

    const now = new Date()
    const nextDue = getNextDueDate(now, task.periodicity)
    
    try {
      const updatedTask = {
        ...task,
        lastCompleted: now.toISOString(),
        nextDue
      }
      
      await updateTask(user.email, task.id, updatedTask)
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t))
      
      toast.success(t.validation.taskCompleted, {
        description: t.validation.taskCompletedDesc
      })
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error(t.validation.error)
    }
  }

  const getNextDueDate = (date: Date, periodicity: { value: number, unit: "days" | "weeks" | "months" }): string => {
    const nextDate = new Date(date)

    switch (periodicity.unit) {
      case "days":
        nextDate.setDate(nextDate.getDate() + periodicity.value)
        break
      case "weeks":
        nextDate.setDate(nextDate.getDate() + (periodicity.value * 7))
        break
      case "months":
        nextDate.setMonth(nextDate.getMonth() + periodicity.value)
        break
    }

    return nextDate.toISOString()
  }

  const getTaskStatus = (task: Task): { status: "overdue" | "due-soon" | "ok"; daysLeft: number } => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    // If task was completed, calculate next due date from last completion
    const baseDate = task.lastCompleted ? new Date(task.lastCompleted) : new Date(task.created)
    const nextDue = new Date(getNextDueDate(baseDate, task.periodicity))
    
    const diffTime = nextDue.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { status: "overdue", daysLeft: diffDays }
    } else if (diffDays <= 2) {
      return { status: "due-soon", daysLeft: diffDays }
    } else {
      return { status: "ok", daysLeft: diffDays }
    }
  }

  // Sort tasks by due date (overdue first, then soon due)
  const sortedTasks = [...userTasks].sort((a, b) => {
    const statusA = getTaskStatus(a)
    const statusB = getTaskStatus(b)

    if (statusA.status === "overdue" && statusB.status !== "overdue") return -1
    if (statusA.status !== "overdue" && statusB.status === "overdue") return 1
    if (statusA.status === "due-soon" && statusB.status === "ok") return -1
    if (statusA.status === "ok" && statusB.status === "due-soon") return 1

    return new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime()
  })

  const formatCompletionDate = (date: string | null): string => {
    if (!date) return t.dashboard.completionStatus.neverCompleted

    const completionDate = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Reset time parts for accurate date comparison
    completionDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    yesterday.setHours(0, 0, 0, 0)

    if (completionDate.getTime() === today.getTime()) {
      return t.dashboard.completionStatus.today
    }

    if (completionDate.getTime() === yesterday.getTime()) {
      return t.dashboard.completionStatus.yesterday
    }

    return replaceParams(t.dashboard.completionStatus.completed, {
      date: completionDate.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">{t.common.dashboard}</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.tasksToday}</CardTitle>
            <CardDescription>{t.dashboard.tasksTodayDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{getTasksDueToday().length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.tasksThisWeek}</CardTitle>
            <CardDescription>{t.dashboard.tasksThisWeekDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{getTasksDueThisWeek().length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.nextWeekTasks}</CardTitle>
            <CardDescription>{t.dashboard.nextWeekTasksDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{getTasksDueNextWeek().length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>{t.dashboard.tasksToday}</CardTitle>
            <CardDescription>{t.dashboard.tasksTodayDesc}</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            className="h-8 w-8 p-0" 
            onClick={() => setShowTodayTasks(!showTodayTasks)}
          >
            {showTodayTasks ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </Button>
        </CardHeader>
        {showTodayTasks && (
          <CardContent>
            {getTasksDueToday().length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="mx-auto h-12 w-12 mb-2" />
                <p>{t.dashboard.noTasksToday}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getTasksDueToday().map((task) => {
                  const roomColor = getRoomColor(task.roomId)
                  return (
                    <div 
                      key={task.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                      style={{ backgroundColor: roomColor + "40" }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: roomColor }}
                          />
                          <h3 className="font-medium">{task.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t.dashboard.room}: {getRoomName(task.roomId)} • {t.dashboard.frequency}: {getPeriodicityLabel(task.periodicity)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCompletionDate(task.lastCompleted)}
                        </p>
                      </div>
                      <Button onClick={() => handleMarkComplete(task)}>
                        {t.dashboard.markComplete}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>{t.dashboard.tasksNeedingAttention}</CardTitle>
            <CardDescription>{t.dashboard.tasksNeedingAttentionDesc}</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            className="h-8 w-8 p-0" 
            onClick={() => setShowNeedingAttention(!showNeedingAttention)}
          >
            {showNeedingAttention ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </Button>
        </CardHeader>
        {showNeedingAttention && (
          <CardContent>
            {getTasksDueThisWeek().length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="mx-auto h-12 w-12 mb-2" />
                <p>{t.dashboard.allCaughtUp}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getTasksDueThisWeek().map((task) => {
                  const { status, daysLeft } = getTaskStatus(task)
                  const roomColor = getRoomColor(task.roomId)

                  return (
                    <div 
                      key={task.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                      style={{ backgroundColor: roomColor + "40" }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: roomColor }}
                          />
                          <h3 className="font-medium">{task.name}</h3>
                          {status === "overdue" ? (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {replaceParams(t.dashboard.overdueBy, { days: Math.abs(daysLeft) })}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-500">
                              <Clock className="h-3 w-3" />
                              {replaceParams(t.dashboard.dueIn, { days: daysLeft })}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t.dashboard.room}: {getRoomName(task.roomId)} • {t.dashboard.frequency}: {getPeriodicityLabel(task.periodicity)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCompletionDate(task.lastCompleted)}
                        </p>
                      </div>
                      <Button onClick={() => handleMarkComplete(task)}>
                        {t.dashboard.markComplete}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>{t.dashboard.nextWeekTasks}</CardTitle>
            <CardDescription>{t.dashboard.nextWeekTasksDesc}</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            className="h-8 w-8 p-0" 
            onClick={() => setShowNextWeekTasks(!showNextWeekTasks)}
          >
            {showNextWeekTasks ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </Button>
        </CardHeader>
        {showNextWeekTasks && (
          <CardContent>
            {getTasksDueNextWeek().length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="mx-auto h-12 w-12 mb-2" />
                <p>{t.dashboard.noTasksNextWeek}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getTasksDueNextWeek().map((task) => {
                  const roomColor = getRoomColor(task.roomId)

                  return (
                    <div 
                      key={task.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                      style={{ backgroundColor: roomColor + "40" }}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: roomColor }}
                          />
                          <h3 className="font-medium">{task.name}</h3>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.nextDue).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t.dashboard.room}: {getRoomName(task.roomId)} • {t.dashboard.frequency}: {getPeriodicityLabel(task.periodicity)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCompletionDate(task.lastCompleted)}
                        </p>
                      </div>
                      <Button onClick={() => handleMarkComplete(task)}>
                        {t.dashboard.markComplete}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}

