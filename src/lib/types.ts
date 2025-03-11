export interface House {
  name: string
  address?: string
}

export interface Room {
  id: string
  name: string
  color: string
  userId: string
  created: string
  updated: string
}

export interface Task {
  id: string
  name: string
  roomId: string
  userId: string
  periodicity: {
    value: number
    unit: "days" | "weeks" | "months"
  }
  created: string
  lastCompleted: string | null
  nextDue: string  
}

