export interface House {
  name: string
  address?: string
}

export type Room = {
  id: string
  name: string
  color: string
}

export type Task = {
  id: string
  name: string
  roomId: string
  periodicity: {
    value: number
    unit: "days" | "weeks" | "months"
  }
  created: string // ISO date string
  lastCompleted: string | null // ISO date string
  nextDue: string // ISO date string
}

