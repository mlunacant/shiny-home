"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus, Home, Calendar, Edit, X, Check, Clock } from "lucide-react"
import { toast } from "sonner"
import type { Room, Task } from "@/lib/types"
import { useI18n, replaceParams } from "@/lib/i18n"
import { useAuth } from "@/lib/contexts/AuthContext"
import { createRoom, getRooms, deleteRoom, createTask, getTasks, deleteTask, getTasksByRoom } from "@/lib/firebase/firebaseUtils"

export default function Setup() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  
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

  const [showRoomForm, setShowRoomForm] = useState(false)
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>("all")
  const roomFormRef = useRef<HTMLFormElement>(null)

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

  // Get tasks for a specific room
  const getRoomTasks = (roomId: string) => {
    return tasks.filter(task => task.roomId === roomId && task.userId === user?.email)
  }

  // Format periodicity label
  const getPeriodicityLabel = (periodicity: { value: number, unit: "days" | "weeks" | "months" }) => {
    return `${periodicity.value} ${t.frequency[periodicity.unit]}`
  }

  // Room functions
  const handleAddRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const color = formData.get("color") as string || "#000000"

    if (!name) {
      toast.error(t.validation.enterRoomName)
      return
    }

    if (!user?.email) {
      toast.error("User not authenticated")
      return
    }

    const newRoom: Room = {
      id: crypto.randomUUID(),
      name,
      color,
      userId: user.email,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    }

    try {
      await createRoom(user.email, newRoom)
      setRooms(prev => [...prev, newRoom])
      toast.success(t.validation.roomAdded.replace("{{name}}", name))
      roomFormRef.current?.reset()
      setShowRoomForm(false)
    } catch (error) {
      console.error('Error creating room:', error)
      toast.error(t.validation.error)
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    if (!user?.email) {
      toast.error("User not authenticated")
      return
    }

    // Check if room belongs to current user
    const room = rooms.find(r => r.id === roomId)
    if (room?.userId !== user.email) {
      toast.error("You can only delete your own rooms")
      return
    }

    const roomTasks = tasks.filter(task => task.roomId === roomId)
    if (roomTasks.length > 0) {
      toast.error(t.setup.deleteFirst)
      return
    }

    try {
      await deleteRoom(user.email, roomId)
      setRooms(prev => prev.filter(room => room.id !== roomId))
      toast.success(t.validation.roomRemoved)
    } catch (error) {
      console.error('Error deleting room:', error)
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

  const addMultiRoomTask = async () => {
    if (!newMultiRoomTask.name || !user?.email) {
      toast.error(t.validation.fillRequired)
      return
    }

    if (newMultiRoomTask.selectedRooms.length === 0) {
      toast.error(t.validation.selectRooms)
      return
    }

    const now = new Date()
    const newTasks = newMultiRoomTask.selectedRooms.map(roomId => ({
      id: crypto.randomUUID(),
      name: newMultiRoomTask.name,
      roomId: roomId,
      userId: user.email,
      periodicity: newMultiRoomTask.periodicity,
      created: now.toISOString(),
      lastCompleted: newMultiRoomTask.lastCompleted,
      nextDue: newMultiRoomTask.lastCompleted ? 
        getNextDueDate(new Date(newMultiRoomTask.lastCompleted), newMultiRoomTask.periodicity) :
        getNextDueDate(now, newMultiRoomTask.periodicity),
    } as Task))

    try {
      await Promise.all(newTasks.map(task => createTask(user.email!, task)))
      setTasks(prev => [...prev, ...newTasks])
      
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
    } catch (error) {
      console.error('Error creating tasks:', error)
      toast.error(t.validation.error)
    }
  }

  const toggleRoomSelection = (roomId: string) => {
    setNewMultiRoomTask(prev => ({
      ...prev,
      selectedRooms: prev.selectedRooms.includes(roomId)
        ? prev.selectedRooms.filter(id => id !== roomId)
        : [...prev.selectedRooms, roomId]
    }))
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!user?.email) {
      toast.error("User not authenticated")
      return
    }

    try {
      await deleteTask(user.email, taskId)
      setTasks(prev => prev.filter(task => task.id !== taskId))
      toast.success(t.validation.taskRemoved)
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error(t.validation.error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Get user tasks
  const userTasks = tasks.filter(task => task.userId === user?.email)

  // Filter tasks by selected room and sort by due date
  const filteredAndSortedTasks = userTasks
    .filter(task => selectedRoomFilter === "all" || task.roomId === selectedRoomFilter)
    .sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime())

  // Format due date
  const formatDueDate = (date: string): string => {
    const dueDate = new Date(date)
    return dueDate.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>{t.setup.yourRooms}</CardTitle>
                <CardDescription>{t.setup.manageRooms}</CardDescription>
              </div>
              <Button onClick={() => setShowRoomForm(true)} disabled={showRoomForm}>
                <Plus className="mr-2 h-4 w-4" /> {t.setup.addRoom}
              </Button>
            </CardHeader>
            <CardContent>
              {showRoomForm && (
                <div className="border rounded-lg p-4 mb-6">
                  <form ref={roomFormRef} onSubmit={handleAddRoom} className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">{t.setup.roomName}</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder={t.setup.roomNamePlaceholder}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="color">{t.setup.roomColor}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="color"
                          name="color"
                          type="color"
                          className="w-10 h-10 p-1 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowRoomForm(false)}
                      >
                        {t.setup.cancel}
                      </Button>
                      <Button type="submit">{t.common.add}</Button>
                    </div>
                  </form>
                </div>
              )}

              {rooms.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border rounded-lg">
                  <Home className="mx-auto h-12 w-12 mb-2" />
                  <p>{t.setup.noRoomsYet}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {rooms.map((room) => {
                    const roomTasks = getRoomTasks(room.id)
                    return (
                      <div
                        key={room.id}
                        className="border rounded-lg overflow-hidden"
                      >
                        <div 
                          className="flex items-center justify-between p-4"
                          style={{ backgroundColor: room.color + "40" }}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: room.color }}
                            />
                            <span className="font-medium">{room.name}</span>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteRoom(room.id)}
                          >
                            {t.setup.deleteRoom}
                          </Button>
                        </div>
                        
                        {/* Tasks section */}
                        <div className="p-4 bg-muted/50">
                          <h4 className="text-sm font-medium mb-3">{t.setup.associatedTasks}</h4>
                          {roomTasks.length === 0 ? (
                            <p className="text-sm text-muted-foreground">{t.setup.noTasks}</p>
                          ) : (
                            <div className="space-y-2">
                              {roomTasks.map((task) => (
                                <div 
                                  key={task.id}
                                  className="flex items-center justify-between p-3 bg-background rounded-lg text-sm"
                                >
                                  <div>
                                    <p className="font-medium">{task.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {getPeriodicityLabel(task.periodicity)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
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

          {/* Existing Tasks List */}
          <Card>
            <CardHeader>
              <CardTitle>{t.setup.yourTasks}</CardTitle>
              <CardDescription>{t.setup.manageTasks}</CardDescription>
            </CardHeader>
            <CardContent>
              {userTasks.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border rounded-lg">
                  <Clock className="mx-auto h-12 w-12 mb-2" />
                  <p>{t.setup.noTasksYet}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Room filter */}
                  <div className="flex items-center gap-2">
                    <Label>{t.setup.filterByRoom}</Label>
                    <Select
                      value={selectedRoomFilter}
                      onValueChange={setSelectedRoomFilter}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t.setup.allRooms}</SelectItem>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tasks list */}
                  <div className="space-y-4">
                    {filteredAndSortedTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t.setup.noTasksInRoom}
                      </p>
                    ) : (
                      filteredAndSortedTasks.map((task) => {
                        const room = rooms.find(r => r.id === task.roomId)
                        if (!room) return null

                        return (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                            style={{ backgroundColor: room.color + "40" }}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: room.color }}
                                />
                                <span className="font-medium">{task.name}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {t.dashboard.room}: {room.name} • {t.dashboard.frequency}: {getPeriodicityLabel(task.periodicity)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t.setup.nextDue}: {formatDueDate(task.nextDue)}
                              </p>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

