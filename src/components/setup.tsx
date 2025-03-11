"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus, Home, Calendar, Edit, X, Check } from "lucide-react"
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
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editTaskData, setEditTaskData] = useState<{
    name: string
    periodicity: {
      value: number
      unit: "days" | "weeks" | "months"
    }
    lastCompleted: string | null
  }>({
    name: "",
    periodicity: {
      value: 1,
      unit: "weeks"
    },
    lastCompleted: null
  })
  const [editingRoom, setEditingRoom] = useState<string | null>(null)
  const [editRoomData, setEditRoomData] = useState<{
    name: string
    color: string
    tasks: Array<{
      name: string
      periodicity: {
        value: number
        unit: "days" | "weeks" | "months"
      }
    }>
  }>({
    name: "",
    color: "#fecaca",
    tasks: []
  })
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [newMultiRoomTask, setNewMultiRoomTask] = useState<{
    name: string
    periodicity: {
      value: number
      unit: "days" | "weeks" | "months"
    }
    lastCompleted: string | null
    selectedRooms: string[]
  }>({
    name: "",
    periodicity: {
      value: 1,
      unit: "weeks"
    },
    lastCompleted: null,
    selectedRooms: []
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

  const startEditTask = (task: Task) => {
    setEditingTask(task.id)
    setEditTaskData({
      name: task.name,
      periodicity: task.periodicity,
      lastCompleted: task.lastCompleted
    })
  }

  const cancelEditTask = () => {
    setEditingTask(null)
  }

  const saveEditTask = (taskId: string) => {
    if (!editTaskData.name) {
      toast.error(t.validation.fillRequired)
      return
    }

    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          name: editTaskData.name,
          periodicity: editTaskData.periodicity,
          lastCompleted: editTaskData.lastCompleted,
          nextDue: editTaskData.lastCompleted ? 
            getNextDueDate(new Date(editTaskData.lastCompleted), editTaskData.periodicity) :
            task.nextDue
        }
      }
      return task
    })

    setTasks(updatedTasks)
    localStorage.setItem("cleaning-tasks", JSON.stringify(updatedTasks))
    setEditingTask(null)

    toast.success(t.validation.taskUpdated)
  }

  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId)
    setTasks(updatedTasks)
    localStorage.setItem("cleaning-tasks", JSON.stringify(updatedTasks))

    toast.success(t.validation.taskRemoved)
  }

  const getTaskStatus = (task: Task): { status: "overdue" | "due-soon" | "ok"; daysLeft: number } => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const dueDate = new Date(task.nextDue)
    dueDate.setHours(0, 0, 0, 0)
    
    const diffTime = dueDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { status: "overdue", daysLeft: diffDays }
    } else if (diffDays <= 2) {
      return { status: "due-soon", daysLeft: diffDays }
    } else {
      return { status: "ok", daysLeft: diffDays }
    }
  }

  const sortTasks = (tasks: Task[]): Task[] => {
    return [...tasks].sort((a, b) => {
      const statusA = getTaskStatus(a)
      const statusB = getTaskStatus(b)

      if (statusA.status === "overdue" && statusB.status !== "overdue") return -1
      if (statusA.status !== "overdue" && statusB.status === "overdue") return 1
      if (statusA.status === "due-soon" && statusB.status === "ok") return -1
      if (statusA.status === "ok" && statusB.status === "due-soon") return 1

      return statusA.daysLeft - statusB.daysLeft
    })
  }

  const startEditRoom = (room: Room) => {
    const roomTasks = tasks.filter(task => task.roomId === room.id)
    setEditingRoom(room.id)
    setEditRoomData({
      name: room.name,
      color: room.color,
      tasks: []  // We'll show existing tasks separately
    })
    setNewRoomTaskInput({
      name: "",
      periodicity: {
        value: 1,
        unit: "weeks"
      }
    })
  }

  const cancelEditRoom = () => {
    setEditingRoom(null)
  }

  const saveEditRoom = (roomId: string) => {
    if (!editRoomData.name) {
      toast.error(t.validation.enterRoomName)
      return
    }

    // Update room
    const updatedRooms = rooms.map((room) => {
      if (room.id === roomId) {
        return {
          ...room,
          name: editRoomData.name,
          color: editRoomData.color
        }
      }
      return room
    })
    setRooms(updatedRooms)
    localStorage.setItem("house-rooms", JSON.stringify(updatedRooms))

    // Create new tasks
    if (editRoomData.tasks.length > 0) {
      const now = new Date()
      const newTasks = editRoomData.tasks.map(taskData => ({
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
    }

    setEditingRoom(null)
    toast.success(t.validation.roomUpdated)
  }

  const addTaskToEditRoom = () => {
    if (!newRoomTaskInput.name) {
      toast.error(t.validation.fillRequired)
      return
    }

    setEditRoomData({
      ...editRoomData,
      tasks: [...editRoomData.tasks, { ...newRoomTaskInput }]
    })
    setNewRoomTaskInput({
      name: "",
      periodicity: {
        value: 1,
        unit: "weeks"
      }
    })
  }

  const removeTaskFromEditRoom = (index: number) => {
    setEditRoomData({
      ...editRoomData,
      tasks: editRoomData.tasks.filter((_, i) => i !== index)
    })
  }

  const addMultiRoomTask = () => {
    if (!newMultiRoomTask.name) {
      toast.error(t.validation.fillRequired)
      return
    }

    if (newMultiRoomTask.selectedRooms.length === 0) {
      toast.error(t.validation.selectRooms)
      return
    }

    const now = new Date()
    const newTasks = newMultiRoomTask.selectedRooms.map(roomId => ({
      id: `task-${Date.now()}-${Math.random()}`,
      name: newMultiRoomTask.name,
      roomId: roomId,
      periodicity: newMultiRoomTask.periodicity,
      created: now.toISOString(),
      lastCompleted: newMultiRoomTask.lastCompleted,
      nextDue: newMultiRoomTask.lastCompleted ? 
        getNextDueDate(new Date(newMultiRoomTask.lastCompleted), newMultiRoomTask.periodicity) :
        getNextDueDate(now, newMultiRoomTask.periodicity),
    }))

    const updatedTasks = [...tasks, ...newTasks]
    setTasks(updatedTasks)
    localStorage.setItem("cleaning-tasks", JSON.stringify(updatedTasks))

    // Reset form
    setNewMultiRoomTask({
      name: "",
      periodicity: {
        value: 1,
        unit: "weeks"
      },
      lastCompleted: null,
      selectedRooms: []
    })
    setShowTaskForm(false)

    toast.success(replaceParams(t.validation.tasksCreated, { count: newTasks.length }))
  }

  const toggleRoomSelection = (roomId: string) => {
    setNewMultiRoomTask(prev => ({
      ...prev,
      selectedRooms: prev.selectedRooms.includes(roomId)
        ? prev.selectedRooms.filter(id => id !== roomId)
        : [...prev.selectedRooms, roomId]
    }))
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="rooms">
        <TabsList>
          <TabsTrigger value="rooms">{t.common.rooms}</TabsTrigger>
          <TabsTrigger value="tasks">{t.common.tasks}</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="space-y-6">
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
                    const roomTasks = sortTasks(tasks.filter((task) => task.roomId === room.id))
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
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => startEditRoom(room)}
                              title={t.setup.editRoom}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
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
                        </div>
                        {editingRoom === room.id ? (
                          <div className="p-3 bg-muted/50">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>{t.setup.roomName}</Label>
                                <Input
                                  value={editRoomData.name}
                                  onChange={(e) => setEditRoomData({ 
                                    ...editRoomData, 
                                    name: e.target.value 
                                  })}
                                  placeholder={t.setup.roomNamePlaceholder}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>{t.setup.roomColor}</Label>
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-10 h-10 rounded-lg border"
                                    style={{ backgroundColor: editRoomData.color }}
                                  />
                                  <Input
                                    type="color"
                                    value={editRoomData.color}
                                    onChange={(e) => setEditRoomData({ 
                                      ...editRoomData, 
                                      color: e.target.value 
                                    })}
                                    className="w-20 h-10 p-1 cursor-pointer"
                                  />
                                </div>
                              </div>

                              <div className="border-t pt-4">
                                <h4 className="font-medium mb-2">{t.setup.associatedTasks}</h4>
                                
                                {/* Add new task form */}
                                <div className="mb-4 border rounded-lg p-3 bg-background">
                                  <h5 className="text-sm font-medium mb-2">{t.setup.createTask}</h5>
                                  <div className="flex gap-2">
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
                                    <Button onClick={addTaskToEditRoom} variant="outline">
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {/* New tasks to be added */}
                                {editRoomData.tasks.length > 0 && (
                                  <div className="space-y-2 mb-4">                               
                                    {editRoomData.tasks.map((task, index) => (
                                      <div key={index} className="flex items-center justify-between p-2 border rounded bg-background">
                                        <div>
                                          <p className="font-medium">{task.name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {getPeriodicityLabel(task.periodicity)}
                                          </p>
                                        </div>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          onClick={() => removeTaskFromEditRoom(index)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Existing tasks */}
                                {roomTasks.length > 0 && (
                                  <div className="space-y-2">                                
                                    {roomTasks.map((task) => (
                                      <div key={task.id} className="text-sm flex items-center justify-between bg-background p-2 rounded">
                                        {editingTask === task.id ? (
                                          <div className="flex-1 space-y-3">
                                            <div className="space-y-2">
                                              <Label>{t.setup.taskName}</Label>
                                              <Input
                                                value={editTaskData.name}
                                                onChange={(e) => setEditTaskData({ 
                                                  ...editTaskData, 
                                                  name: e.target.value 
                                                })}
                                                placeholder={t.setup.taskNamePlaceholder}
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label>{t.dashboard.frequency}</Label>
                                              <div className="flex gap-2">
                                                <div className="space-y-1">
                                                  <Label className="text-xs">Value</Label>
                                                  <Input
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
                                                </div>
                                                <div className="space-y-1 flex-1">
                                                  <Label className="text-xs">Unit</Label>
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
                                                <div className="space-y-1">
                                                  <Label className="text-xs">Last completed</Label>
                                                  <Input
                                                    type="date"
                                                    value={editTaskData.lastCompleted ? new Date(editTaskData.lastCompleted).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => setEditTaskData({
                                                      ...editTaskData,
                                                      lastCompleted: e.target.value ? new Date(e.target.value).toISOString() : null
                                                    })}
                                                    className="w-40"
                                                  />
                                                </div>
                                                <div className="flex gap-2 self-end">
                                                  <Button variant="outline" size="icon" onClick={cancelEditTask}>
                                                    <X className="h-4 w-4" />
                                                  </Button>
                                                  <Button size="icon" onClick={() => saveEditTask(task.id)}>
                                                    <Check className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
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
                                            <div className="flex gap-2">
                                              <Button variant="ghost" size="icon" onClick={() => startEditTask(task)}>
                                                <Edit className="h-4 w-4" />
                                              </Button>
                                              <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="outline" 
                                  onClick={cancelEditRoom}
                                >
                                  {t.setup.cancel}
                                </Button>
                                <Button onClick={() => saveEditRoom(room.id)}>
                                  {t.setup.save}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          roomTasks.length > 0 && (
                            <div className="p-3 bg-muted/50">
                              <p className="text-sm font-medium mb-2">{t.setup.associatedTasks}:</p>
                              <div className="space-y-2">
                                {roomTasks.map((task) => (
                                  <div key={task.id} className="text-sm flex items-center justify-between bg-background p-2 rounded">
                                    {editingTask === task.id ? (
                                      <div className="flex-1 space-y-3">
                                        <div className="space-y-2">
                                          <Label>{t.setup.taskName}</Label>
                                          <Input
                                            value={editTaskData.name}
                                            onChange={(e) => setEditTaskData({ 
                                              ...editTaskData, 
                                              name: e.target.value 
                                            })}
                                            placeholder={t.setup.taskNamePlaceholder}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>{t.dashboard.frequency}</Label>
                                          <div className="flex gap-2">
                                            <div className="space-y-1">
                                              <Label className="text-xs">Value</Label>
                                              <Input
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
                                            </div>
                                            <div className="space-y-1 flex-1">
                                              <Label className="text-xs">Unit</Label>
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
                                            <div className="space-y-1">
                                              <Label className="text-xs">Last completed</Label>
                                              <Input
                                                type="date"
                                                value={editTaskData.lastCompleted ? new Date(editTaskData.lastCompleted).toISOString().split('T')[0] : ''}
                                                onChange={(e) => setEditTaskData({
                                                  ...editTaskData,
                                                  lastCompleted: e.target.value ? new Date(e.target.value).toISOString() : null
                                                })}
                                                className="w-40"
                                              />
                                            </div>
                                            <div className="flex gap-2 self-end">
                                              <Button variant="outline" size="icon" onClick={cancelEditTask}>
                                                <X className="h-4 w-4" />
                                              </Button>
                                              <Button size="icon" onClick={() => saveEditTask(task.id)}>
                                                <Check className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
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
                                        <div className="flex gap-2">
                                          <Button variant="ghost" size="icon" onClick={() => startEditTask(task)}>
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.setup.createTasks}</CardTitle>
              <CardDescription>{t.setup.createTasksDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowTaskForm(true)} 
                className="w-full mb-6" 
                disabled={showTaskForm || rooms.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" /> {t.setup.addTask}
              </Button>

              {showTaskForm && (
                <div className="border rounded-lg p-4 mb-6 space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="task-name">{t.setup.taskName}</Label>
                      <Input
                        id="task-name"
                        placeholder={t.setup.taskNamePlaceholder}
                        value={newMultiRoomTask.name}
                        onChange={(e) => setNewMultiRoomTask(prev => ({ 
                          ...prev, 
                          name: e.target.value 
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t.dashboard.frequency}</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={newMultiRoomTask.periodicity.value}
                          onChange={(e) => {
                            const value = Math.min(30, Math.max(1, parseInt(e.target.value) || 1))
                            setNewMultiRoomTask(prev => ({
                              ...prev,
                              periodicity: {
                                ...prev.periodicity,
                                value
                              }
                            }))
                          }}
                          className="w-20"
                        />
                        <Select
                          value={newMultiRoomTask.periodicity.unit}
                          onValueChange={(value: "days" | "weeks" | "months") => setNewMultiRoomTask(prev => ({ 
                            ...prev, 
                            periodicity: {
                              ...prev.periodicity,
                              unit: value
                            }
                          }))}
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
                      <Label>{t.setup.lastCompleted}</Label>
                      <Input
                        type="date"
                        value={newMultiRoomTask.lastCompleted ? new Date(newMultiRoomTask.lastCompleted).toISOString().split('T')[0] : ''}
                        onChange={(e) => setNewMultiRoomTask(prev => ({
                          ...prev,
                          lastCompleted: e.target.value ? new Date(e.target.value).toISOString() : null
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{t.setup.selectRooms}</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                        {rooms.map((room) => (
                          <div 
                            key={room.id} 
                            className="flex items-center space-x-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                            style={{ backgroundColor: room.color + "20" }}
                          >
                            <Checkbox
                              id={`room-${room.id}`}
                              checked={newMultiRoomTask.selectedRooms.includes(room.id)}
                              onCheckedChange={() => toggleRoomSelection(room.id)}
                              className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                            />
                            <div className="flex items-center gap-2 flex-1">
                              <div 
                                className="w-3 h-3 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: room.color }}
                              />
                              <label 
                                htmlFor={`room-${room.id}`}
                                className="text-sm font-medium leading-none cursor-pointer select-none flex-1"
                              >
                                {room.name}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowTaskForm(false)
                        setNewMultiRoomTask({
                          name: "",
                          periodicity: {
                            value: 1,
                            unit: "weeks"
                          },
                          lastCompleted: null,
                          selectedRooms: []
                        })
                      }}
                    >
                      {t.setup.cancel}
                    </Button>
                    <Button onClick={addMultiRoomTask}>
                      {t.setup.save}
                    </Button>
                  </div>
                </div>
              )}

              {!showTaskForm && rooms.length === 0 && (
                <div className="text-center py-6 text-muted-foreground border rounded-lg">
                  <Home className="mx-auto h-12 w-12 mb-2" />
                  <p>{t.setup.createRoomFirst}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

