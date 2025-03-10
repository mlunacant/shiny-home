export interface House {
  name: string
  address?: string
}

export interface Room {
  id: string
  name: string
  type?: string
}

export interface Task {
  id: string
  name: string
  description?: string
  roomId: string
  periodicity: string // daily, weekly, biweekly, monthly, quarterly
  created: string // ISO date string
  lastCompleted: string | null // ISO date string
  nextDue: string // ISO date string
}

