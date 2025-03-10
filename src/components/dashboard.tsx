"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, Clock } from "lucide-react"
import type { Task, Room } from "@/lib/types"

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  

  useEffect(() => {
    // Load tasks and rooms from localStorage
    const savedTasks = localStorage.getItem("cleaning-tasks")
    const savedRooms = localStorage.getItem("house-rooms")

    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    }

    if (savedRooms) {
      setRooms(JSON.parse(savedRooms))
    }
  }, [])

  const markTaskComplete = (taskId: string) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        const now = new Date()
        return {
          ...task,
          lastCompleted: now.toISOString(),
          nextDue: getNextDueDate(now, task.periodicity),
        }
      }
      return task
    })

    setTasks(updatedTasks)
    localStorage.setItem("cleaning-tasks", JSON.stringify(updatedTasks))
   
  }

  const getNextDueDate = (date: Date, periodicity: string): string => {
    const nextDate = new Date(date)

    switch (periodicity) {
      case "daily":
        nextDate.setDate(nextDate.getDate() + 1)
        break
      case "weekly":
        nextDate.setDate(nextDate.getDate() + 7)
        break
      case "biweekly":
        nextDate.setDate(nextDate.getDate() + 14)
        break
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + 1)
        break
      case "quarterly":
        nextDate.setMonth(nextDate.getMonth() + 3)
        break
      default:
        nextDate.setDate(nextDate.getDate() + 7) // Default to weekly
    }

    return nextDate.toISOString()
  }

  const getTaskStatus = (task: Task): { status: "overdue" | "due-soon" | "ok"; daysLeft: number } => {
    const now = new Date()
    const nextDue = new Date(task.nextDue)
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

  const getRoomName = (roomId: string): string => {
    const room = rooms.find((r) => r.id === roomId)
    return room ? room.name : "Unknown Room"
  }

  // Sort tasks by due date (overdue first, then soon due)
  const sortedTasks = [...tasks].sort((a, b) => {
    const statusA = getTaskStatus(a)
    const statusB = getTaskStatus(b)

    if (statusA.status === "overdue" && statusB.status !== "overdue") return -1
    if (statusA.status !== "overdue" && statusB.status === "overdue") return 1
    if (statusA.status === "due-soon" && statusB.status === "ok") return -1
    if (statusA.status === "ok" && statusB.status === "due-soon") return 1

    return new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime()
  })

  // Filter tasks that need attention (overdue or due soon)
  const tasksNeedingAttention = sortedTasks.filter((task) => {
    const { status } = getTaskStatus(task)
    return status === "overdue" || status === "due-soon"
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tasks Needing Attention</CardTitle>
          <CardDescription>Tasks that are overdue or due soon</CardDescription>
        </CardHeader>
        <CardContent>
          {tasksNeedingAttention.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle className="mx-auto h-12 w-12 mb-2" />
              <p>All caught up! No tasks need immediate attention.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasksNeedingAttention.map((task) => {
                const { status, daysLeft } = getTaskStatus(task)

                return (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{task.name}</h3>
                        {status === "overdue" ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Overdue by {Math.abs(daysLeft)} days
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="flex items-center gap-1 bg-yellow-500">
                            <Clock className="h-3 w-3" />
                            Due in {daysLeft} days
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Room: {getRoomName(task.roomId)} • Frequency: {task.periodicity}
                      </p>
                    </div>
                    <Button onClick={() => markTaskComplete(task.id)}>Mark Complete</Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>Overview of all cleaning tasks</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>No tasks defined yet. Go to the Task Setup tab to create tasks.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedTasks.map((task) => {
                const { status, daysLeft } = getTaskStatus(task)

                return (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{task.name}</h3>
                        {status === "overdue" ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Overdue by {Math.abs(daysLeft)} days
                          </Badge>
                        ) : status === "due-soon" ? (
                          <Badge variant="warning" className="flex items-center gap-1 bg-yellow-500">
                            <Clock className="h-3 w-3" />
                            Due in {daysLeft} days
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1">
                            Due in {daysLeft} days
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Room: {getRoomName(task.roomId)} • Frequency: {task.periodicity}
                      </p>
                      {task.lastCompleted && (
                        <p className="text-xs text-muted-foreground">
                          Last completed: {new Date(task.lastCompleted).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Button onClick={() => markTaskComplete(task.id)}>Mark Complete</Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

