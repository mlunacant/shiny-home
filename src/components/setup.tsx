"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Plus, Home, ClipboardList, Edit, X, Check } from "lucide-react"
import { toast } from "sonner"
import type { House, Room, Task } from "@/lib/types"

export default function Setup() {
  const [house, setHouse] = useState<House>({ name: "", address: "" })
  const [rooms, setRooms] = useState<Room[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [newRoom, setNewRoom] = useState<{ name: string; type: string }>({ name: "", type: "" })
  const [newTask, setNewTask] = useState<{
    name: string
    description: string
    roomId: string
    periodicity: string
  }>({
    name: "",
    description: "",
    roomId: "",
    periodicity: "weekly",
  })
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editTaskData, setEditTaskData] = useState<{
    name: string
    description: string
    roomId: string
    periodicity: string
  }>({
    name: "",
    description: "",
    roomId: "",
    periodicity: "weekly",
  })

  useEffect(() => {
    // Load house, rooms and tasks from localStorage
    const savedHouse = localStorage.getItem("house-details")
    const savedRooms = localStorage.getItem("house-rooms")
    const savedTasks = localStorage.getItem("cleaning-tasks")

    if (savedHouse) {
      setHouse(JSON.parse(savedHouse))
    }

    if (savedRooms) {
      setRooms(JSON.parse(savedRooms))
    }

    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    }
  }, [])

  // House functions
  const saveHouse = () => {
    if (!house.name) {
      toast.error("Please enter a house name")
      return
    }

    localStorage.setItem("house-details", JSON.stringify(house))
    toast.success("Your house details have been saved successfully")
  }

  // Room functions
  const addRoom = () => {
    if (!newRoom.name) {
      toast.error("Please enter a room name")
      return
    }

    const roomId = `room-${Date.now()}`
    const updatedRooms = [...rooms, { id: roomId, ...newRoom }]

    setRooms(updatedRooms)
    localStorage.setItem("house-rooms", JSON.stringify(updatedRooms))
    setNewRoom({ name: "", type: "" })

    toast.success(`${newRoom.name} has been added to your house`)
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
      description: newTask.description,
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
      description: "",
      roomId: "",
      periodicity: "weekly",
    })

    toast.success(`${newTask.name} has been added to your cleaning schedule`)
  }

  const startEditTask = (task: Task) => {
    setEditingTask(task.id)
    setEditTaskData({
      name: task.name,
      description: task.description || "",
      roomId: task.roomId,
      periodicity: task.periodicity,
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
          description: editTaskData.description,
          roomId: editTaskData.roomId,
          periodicity: editTaskData.periodicity,
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

  const getRoomName = (roomId: string): string => {
    const room = rooms.find((r) => r.id === roomId)
    return room ? room.name : "Unknown Room"
  }

  const getPeriodicityLabel = (periodicity: string): string => {
    switch (periodicity) {
      case "daily":
        return "Daily"
      case "weekly":
        return "Weekly"
      case "biweekly":
        return "Every 2 Weeks"
      case "monthly":
        return "Monthly"
      case "quarterly":
        return "Every 3 Months"
      default:
        return periodicity
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="house" className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-4">
          <TabsTrigger value="house">House</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        {/* House Tab */}
        <TabsContent value="house">
          <Card>
            <CardHeader>
              <CardTitle>House Details</CardTitle>
              <CardDescription>Define your house information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="house-name">House Name</Label>
                <Input
                  id="house-name"
                  placeholder="My Home"
                  value={house.name}
                  onChange={(e) => setHouse({ ...house, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="house-address">Address (Optional)</Label>
                <Input
                  id="house-address"
                  placeholder="123 Main St"
                  value={house.address}
                  onChange={(e) => setHouse({ ...house, address: e.target.value })}
                />
              </div>

              <Button onClick={saveHouse} className="w-full">
                Save House Details
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <CardTitle>Add Room</CardTitle>
              <CardDescription>Add rooms to your house</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="room-name">Room Name</Label>
                  <Input
                    id="room-name"
                    placeholder="Living Room"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room-type">Room Type (Optional)</Label>
                  <Input
                    id="room-type"
                    placeholder="Common Area"
                    value={newRoom.type}
                    onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={addRoom} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add Room
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your Rooms</CardTitle>
              <CardDescription>Manage your house rooms</CardDescription>
            </CardHeader>
            <CardContent>
              {rooms.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border rounded-lg">
                  <Home className="mx-auto h-12 w-12 mb-2" />
                  <p>No rooms added yet. Add your first room above.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rooms.map((room) => (
                    <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{room.name}</p>
                        {room.type && <p className="text-sm text-muted-foreground">{room.type}</p>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteRoom(room.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Create Cleaning Task</CardTitle>
              <CardDescription>Define cleaning tasks and their frequency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rooms.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border rounded-lg">
                  <p>You need to add rooms first. Go to the Rooms tab to add rooms.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="task-name">Task Name</Label>
                    <Input
                      id="task-name"
                      placeholder="Vacuum Floor"
                      value={newTask.name}
                      onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="task-description">Description (Optional)</Label>
                    <Input
                      id="task-description"
                      placeholder="Vacuum all carpeted areas"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="task-room">Room</Label>
                    <Select value={newTask.roomId} onValueChange={(value) => setNewTask({ ...newTask, roomId: value })}>
                      <SelectTrigger id="task-room">
                        <SelectValue placeholder="Select a room" />
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
                    <Label htmlFor="task-periodicity">Frequency</Label>
                    <Select
                      value={newTask.periodicity}
                      onValueChange={(value) => setNewTask({ ...newTask, periodicity: value })}
                    >
                      <SelectTrigger id="task-periodicity">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Every 3 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={addTask} className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Add Task
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your Cleaning Tasks</CardTitle>
              <CardDescription>Manage your defined cleaning tasks</CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border rounded-lg">
                  <ClipboardList className="mx-auto h-12 w-12 mb-2" />
                  <p>No tasks defined yet. Create your first task above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-3 border rounded-lg">
                      {editingTask === task.id ? (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor={`edit-name-${task.id}`}>Task Name</Label>
                            <Input
                              id={`edit-name-${task.id}`}
                              value={editTaskData.name}
                              onChange={(e) => setEditTaskData({ ...editTaskData, name: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`edit-desc-${task.id}`}>Description</Label>
                            <Input
                              id={`edit-desc-${task.id}`}
                              value={editTaskData.description}
                              onChange={(e) => setEditTaskData({ ...editTaskData, description: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`edit-room-${task.id}`}>Room</Label>
                            <Select
                              value={editTaskData.roomId}
                              onValueChange={(value) => setEditTaskData({ ...editTaskData, roomId: value })}
                            >
                              <SelectTrigger id={`edit-room-${task.id}`}>
                                <SelectValue placeholder="Select a room" />
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
                            <Label htmlFor={`edit-period-${task.id}`}>Frequency</Label>
                            <Select
                              value={editTaskData.periodicity}
                              onValueChange={(value) => setEditTaskData({ ...editTaskData, periodicity: value })}
                            >
                              <SelectTrigger id={`edit-period-${task.id}`}>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Every 3 Months</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex justify-end space-x-2 mt-2">
                            <Button variant="outline" size="sm" onClick={cancelEditTask}>
                              <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                            <Button size="sm" onClick={() => saveEditTask(task.id)}>
                              <Check className="h-4 w-4 mr-1" /> Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h3 className="font-medium">{task.name}</h3>
                            {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                            <p className="text-xs text-muted-foreground">
                              Room: {getRoomName(task.roomId)} • Frequency: {getPeriodicityLabel(task.periodicity)}
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

