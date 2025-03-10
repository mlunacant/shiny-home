"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Plus, Home, ClipboardList, Edit, X, Check, Calendar } from "lucide-react"
import { toast } from "sonner"
import type { Room, Task } from "@/lib/types"
import { useI18n, replaceParams } from "@/lib/i18n"

export default function Setup() {
  const { t, lang } = useI18n()
  const [rooms, setRooms] = useState<Room[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [showRoomForm, setShowRoomForm] = useState(false)
  const [newRoom, setNewRoom] = useState<{ 
    name: string
    color: string 
  }>({ 
    name: "", 
    color: "#fecaca"
  })
  const [newRoomTasks, setNewRoomTasks] = useState<Array<{
    name: string
    periodicity: {
      value: number
      unit: "days" | "weeks" | "months"
    }
  }>>([])
  const [newRoomTaskInput, setNewRoomTaskInput] = useState<{
    name: string
    periodicity: {
      value: number
      unit: "days" | "weeks" | "months"
    }
  }>({
    name: "",
    periodicity: {
      value: 1,
      unit: "weeks"
    }
  })
  const [newTask, setNewTask] = useState<{
    name: string
    roomId: string
    periodicity: {
      value: number
      unit: "days" | "weeks" | "months"
    }
  }>({
    name: "",
    roomId: "",
    periodicity: {
      value: 1,
      unit: "weeks"
    }
  })
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editTaskData, setEditTaskData] = useState<{
    name: string
    roomId: string
    periodicity: {
      value: number
      unit: "days" | "weeks" | "months"
    }
    lastCompleted: string | null
  }>({
    name: "",
    roomId: "",
    periodicity: {
      value: 1,
      unit: "weeks"
    },
    //lastCompleted default value is 1 year before today
    lastCompleted: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString()
  })

  useEffect(() => {
    // Load rooms and tasks from localStorage
    const savedRooms = localStorage.getItem("house-rooms")
    const savedTasks = localStorage.getItem("cleaning-tasks")

    if (savedRooms) {
      setRooms(JSON.parse(savedRooms))
    }

    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    }
  }, [])

  // Get next color for a new room
  const getNextColor = (): string => {
    if (rooms.length === 0) return "#fecaca"
    
    // Find the first unused color
    const usedColors = new Set(rooms.map(room => room.color))
    const availableColor = ["#fecaca", "#fed7aa", "#fef08a", "#bbf7d0", "#bfdbfe", "#ddd6fe", "#fbcfe8", "#e5e7eb"].find(color => !usedColors.has(color))
    
    // If all colors are used, cycle through them
    if (!availableColor) {
      return rooms[rooms.length % rooms.length].color
    }
    
    return availableColor
  }

  // Room functions
  const addRoom = () => {
    if (!newRoom.name) {
      toast.error(t.validation.enterRoomName)
      return
    }

    const roomId = `room-${Date.now()}`
    const newRoomData = { 
      id: roomId, 
      name: newRoom.name,
      color: newRoom.color
    }

    // Create room
    const updatedRooms = [...rooms, newRoomData]
    setRooms(updatedRooms)
    localStorage.setItem("house-rooms", JSON.stringify(updatedRooms))

    // Create associated tasks
    const now = new Date()
    const newTasks = newRoomTasks.map(taskData => ({
      id: `task-${Date.now()}-${Math.random()}`,
      name: taskData.name,
      roomId: roomId,
      periodicity: taskData.periodicity,
      created: now.toISOString(),
      lastCompleted: null,
      nextDue: getNextDueDate(now, taskData.periodicity),
    }))

    const updatedTasks = [...tasks, ...newTasks]
    setTasks(updatedTasks)
    localStorage.setItem("cleaning-tasks", JSON.stringify(updatedTasks))

    // Reset form
    setNewRoom({ name: "", color: getNextColor() })
    setNewRoomTasks([])
    setShowRoomForm(false)

    toast.success(replaceParams(t.validation.roomAdded, { name: newRoom.name }))
  }

  const addTaskToRoom = () => {
    if (!newRoomTaskInput.name) {
      toast.error(t.validation.fillRequired)
      return
    }

    setNewRoomTasks([...newRoomTasks, { ...newRoomTaskInput }])
    setNewRoomTaskInput({
      name: "",
      periodicity: {
        value: 1,
        unit: "weeks"
      }
    })
  }

  const removeTaskFromRoom = (index: number) => {
    setNewRoomTasks(newRoomTasks.filter((_, i) => i !== index))
  }

  const deleteRoom = (roomId: string) => {
    // Check if any tasks are linked to this room
    const linkedTasks = tasks.filter((task) => task.roomId === roomId)

    if (linkedTasks.length > 0) {
      toast.error(`This room has ${linkedTasks.length} tasks linked to it. Delete the tasks first.`)
      return
    }

    const updatedRooms = rooms.filter((room) => room.id !== roomId)
    setRooms(updatedRooms)
    localStorage.setItem("house-rooms", JSON.stringify(updatedRooms))

    toast.success("The room has been removed from your house")
  }

  // Task functions
  const addTask = () => {
    if (!newTask.name || !newTask.roomId || !newTask.periodicity) {
      toast.error("Please fill in all required fields")
      return
    }

    const now = new Date()
    const taskId = `task-${Date.now()}`

    const task: Task = {
      id: taskId,
      name: newTask.name,
      roomId: newTask.roomId,
      periodicity: newTask.periodicity,
      created: now.toISOString(),
      lastCompleted: null,
      nextDue: getNextDueDate(now, newTask.periodicity),
    }

    const updatedTasks = [...tasks, task]
    setTasks(updatedTasks)
    localStorage.setItem("cleaning-tasks", JSON.stringify(updatedTasks))

    // Reset form
    setNewTask({
      name: "",
      roomId: "",
      periodicity: {
        value: 1,
        unit: "weeks"
      }
    })

    toast.success(`${newTask.name} has been added to your cleaning schedule`)
  }

  const startEditTask = (task: Task) => {
    setEditingTask(task.id)
    setEditTaskData({
      name: task.name,
      roomId: task.roomId,
      periodicity: task.periodicity,
      lastCompleted: task.lastCompleted
    })
  }

  const cancelEditTask = () => {
    setEditingTask(null)
  }

  const saveEditTask = (taskId: string) => {
    if (!editTaskData.name || !editTaskData.roomId || !editTaskData.periodicity) {
      toast.error("Please fill in all required fields")
      return
    }

    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          name: editTaskData.name,
          roomId: editTaskData.roomId,
          periodicity: editTaskData.periodicity,
          lastCompleted: editTaskData.lastCompleted
        }
      }
      return task
    })

    setTasks(updatedTasks)
    localStorage.setItem("cleaning-tasks", JSON.stringify(updatedTasks))
    setEditingTask(null)

    toast.success("The task has been updated successfully")
  }

  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId)
    setTasks(updatedTasks)
    localStorage.setItem("cleaning-tasks", JSON.stringify(updatedTasks))

    toast.success("The task has been removed from your cleaning schedule")
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

  const getRoomName = (roomId: string): string => {
    const room = rooms.find((r) => r.id === roomId)
    return room ? room.name : "Unknown Room"
  }

  const getPeriodicityLabel = (periodicity: { value: number, unit: "days" | "weeks" | "months" }): string => {
    const unit = t.frequency[periodicity.unit] || periodicity.unit;
    return replaceParams(t.frequency.every, { value: periodicity.value, unit: unit.toLowerCase() })
  }

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

  return (
    <div className="space-y-6">
      <Tabs defaultValue="rooms" className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="rooms">{t.common.rooms}</TabsTrigger>
          <TabsTrigger value="tasks">{t.common.tasks}</TabsTrigger>
        </TabsList>

        {/* Rooms Tab */}
        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <CardTitle>{t.setup.yourRooms}</CardTitle>
              <CardDescription>{t.setup.manageRooms}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowRoomForm(true)} className="w-full mb-6" disabled={showRoomForm}>
                <Plus className="mr-2 h-4 w-4" /> {t.setup.addRoom}
              </Button>

              {showRoomForm && (
                <div className="border rounded-lg p-4 mb-6 space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="room-name">{t.setup.roomName}</Label>
                      <Input
                        id="room-name"
                        placeholder={t.setup.roomNamePlaceholder}
                        value={newRoom.name}
                        onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t.setup.roomColor}</Label>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg border"
                          style={{ backgroundColor: newRoom.color }}
                        />
                        <Input
                          type="color"
                          value={newRoom.color}
                          onChange={(e) => setNewRoom({ ...newRoom, color: e.target.value })}
                          className="w-20 h-10 p-1 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">{t.setup.associatedTasks}</h4>
                    
                    {/* Task list */}
                    {newRoomTasks.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {newRoomTasks.map((task, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <p className="font-medium">{task.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {getPeriodicityLabel(task.periodicity)}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeTaskFromRoom(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add task form */}
                    <div className="flex gap-2 mb-4">
                      <div className="flex-1">
                        <Input
                          placeholder={t.setup.taskNamePlaceholder}
                          value={newRoomTaskInput.name}
                          onChange={(e) => setNewRoomTaskInput({ 
                            ...newRoomTaskInput, 
                            name: e.target.value 
                          })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={newRoomTaskInput.periodicity.value}
                          onChange={(e) => {
                            const value = Math.min(30, Math.max(1, parseInt(e.target.value) || 1))
                            setNewRoomTaskInput({
                              ...newRoomTaskInput,
                              periodicity: {
                                ...newRoomTaskInput.periodicity,
                                value
                              }
                            })
                          }}
                          className="w-20"
                        />
                        <Select
                          value={newRoomTaskInput.periodicity.unit}
                          onValueChange={(value: "days" | "weeks" | "months") => setNewRoomTaskInput({ 
                            ...newRoomTaskInput, 
                            periodicity: {
                              ...newRoomTaskInput.periodicity,
                              unit: value
                            }
                          })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="days">{t.frequency.days}</SelectItem>
                            <SelectItem value="weeks">{t.frequency.weeks}</SelectItem>
                            <SelectItem value="months">{t.frequency.months}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={addTaskToRoom} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowRoomForm(false)
                        setNewRoom({ name: "", color: getNextColor() })
                        setNewRoomTasks([])
                      }}
                    >
                      {t.setup.cancel}
                    </Button>
                    <Button onClick={addRoom}>
                      {t.setup.save}
                    </Button>
                  </div>
                </div>
              )}

              {rooms.length === 0 && !showRoomForm ? (
                <div className="text-center py-6 text-muted-foreground border rounded-lg">
                  <Home className="mx-auto h-12 w-12 mb-2" />
                  <p>{t.setup.noRoomsYet}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rooms.map((room) => {
                    const roomTasks = tasks.filter((task) => task.roomId === room.id)
                    return (
                      <div key={room.id} className="border rounded-lg" style={{ backgroundColor: room.color + "40" }}>
                        <div className="flex items-center justify-between p-3 border-b">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: room.color }}
                            />
                            <p className="font-medium">{room.name}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteRoom(room.id)}
                            disabled={roomTasks.length > 0}
                            title={roomTasks.length > 0 ? t.setup.deleteFirst : t.setup.deleteRoom}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {roomTasks.length > 0 && (
                          <div className="p-3 bg-muted/50">
                            <p className="text-sm font-medium mb-2">{t.setup.associatedTasks}:</p>
                            <div className="space-y-2">
                              {roomTasks.map((task) => (
                                <div key={task.id} className="text-sm flex items-center justify-between bg-background p-2 rounded">
                                  <div className="space-y-1">
                                    <p className="font-medium">{task.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span>{t.dashboard.frequency}: {getPeriodicityLabel(task.periodicity)}</span>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatCompletionDate(task.lastCompleted)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>{t.setup.createTask}</CardTitle>
              <CardDescription>{t.setup.createTaskDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rooms.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border rounded-lg">
                  <p>{t.setup.needRooms}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="task-name">{t.setup.taskName}</Label>
                    <Input
                      id="task-name"
                      placeholder={t.setup.taskNamePlaceholder}
                      value={newTask.name}
                      onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="task-room">{t.setup.selectRoom}</Label>
                    <Select value={newTask.roomId} onValueChange={(value) => setNewTask({ ...newTask, roomId: value })}>
                      <SelectTrigger id="task-room">
                        <SelectValue placeholder={t.setup.selectRoom} />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="task-periodicity">{t.setup.frequency}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="task-periodicity-value"
                        type="number"
                        min={1}
                        max={30}
                        value={newTask.periodicity.value}
                        onChange={(e) => {
                          const value = Math.min(30, Math.max(1, parseInt(e.target.value) || 1))
                          setNewTask({
                            ...newTask,
                            periodicity: {
                              ...newTask.periodicity,
                              value
                            }
                          })
                        }}
                        className="w-20"
                      />
                      <Select
                        value={newTask.periodicity.unit}
                        onValueChange={(value: "days" | "weeks" | "months") => setNewTask({ 
                          ...newTask, 
                          periodicity: {
                            ...newTask.periodicity,
                            unit: value
                          }
                        })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">{t.frequency.days}</SelectItem>
                          <SelectItem value="weeks">{t.frequency.weeks}</SelectItem>
                          <SelectItem value="months">{t.frequency.months}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={addTask} className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> {t.common.add} {t.common.tasks}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{t.setup.yourTasks}</CardTitle>
              <CardDescription>{t.setup.manageTasks}</CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border rounded-lg">
                  <ClipboardList className="mx-auto h-12 w-12 mb-2" />
                  <p>{t.setup.noTasksYet}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-3 border rounded-lg">
                      {editingTask === task.id ? (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor={`edit-name-${task.id}`}>{t.setup.taskName}</Label>
                            <Input
                              id={`edit-name-${task.id}`}
                              value={editTaskData.name}
                              onChange={(e) => setEditTaskData({ ...editTaskData, name: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`edit-room-${task.id}`}>{t.setup.selectRoom}</Label>
                            <Select
                              value={editTaskData.roomId}
                              onValueChange={(value) => setEditTaskData({ ...editTaskData, roomId: value })}
                            >
                              <SelectTrigger id={`edit-room-${task.id}`}>
                                <SelectValue placeholder={t.setup.selectRoom} />
                              </SelectTrigger>
                              <SelectContent>
                                {rooms.map((room) => (
                                  <SelectItem key={room.id} value={room.id}>
                                    {room.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`edit-period-${task.id}`}>{t.setup.frequency}</Label>
                            <div className="flex gap-2">
                              <Input
                                id={`edit-period-value-${task.id}`}
                                type="number"
                                min={1}
                                max={30}
                                value={editTaskData.periodicity.value}
                                onChange={(e) => {
                                  const value = Math.min(30, Math.max(1, parseInt(e.target.value) || 1))
                                  setEditTaskData({
                                    ...editTaskData,
                                    periodicity: {
                                      ...editTaskData.periodicity,
                                      value
                                    }
                                  })
                                }}
                                className="w-20"
                              />
                              <Select
                                value={editTaskData.periodicity.unit}
                                onValueChange={(value: "days" | "weeks" | "months") => setEditTaskData({ 
                                  ...editTaskData, 
                                  periodicity: {
                                    ...editTaskData.periodicity,
                                    unit: value
                                  }
                                })}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="days">{t.frequency.days}</SelectItem>
                                  <SelectItem value="weeks">{t.frequency.weeks}</SelectItem>
                                  <SelectItem value="months">{t.frequency.months}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`edit-completed-${task.id}`}>{t.setup.lastCompleted}</Label>
                            <div className="flex gap-2">
                              <Input
                                id={`edit-completed-${task.id}`}
                                type="datetime-local"
                                value={editTaskData.lastCompleted ? new Date(editTaskData.lastCompleted).toISOString().slice(0, 16) : ""}
                                onChange={(e) => setEditTaskData({ 
                                  ...editTaskData, 
                                  lastCompleted: e.target.value ? new Date(e.target.value).toISOString() : null 
                                })}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setEditTaskData({ ...editTaskData, lastCompleted: null })}
                                title={t.setup.clearDate}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex justify-end space-x-2 mt-2">
                            <Button variant="outline" size="sm" onClick={cancelEditTask}>
                              <X className="h-4 w-4 mr-1" /> {t.setup.cancel}
                            </Button>
                            <Button size="sm" onClick={() => saveEditTask(task.id)}>
                              <Check className="h-4 w-4 mr-1" /> {t.setup.save}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="font-medium">{task.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {getRoomName(task.roomId)} • {getPeriodicityLabel(task.periodicity)}
                            </p>
                          </div>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => startEditTask(task)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

