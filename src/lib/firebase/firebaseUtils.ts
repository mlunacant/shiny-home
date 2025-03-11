import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore'
import { auth, db } from './firebase'
import type { Room, Task } from '@/lib/types'

// Auth functions
export const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
    throw error
  }
}

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
    throw error
  }
}

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider()
    const userCredential = await signInWithPopup(auth, provider)
    return userCredential.user
  } catch (error) {
    throw error
  }
}

export const logOut = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    throw error
  }
}

// Room functions
export const createRoom = async (userId: string, room: Room) => {
  try {
    await setDoc(doc(db, `users/${userId}/rooms/${room.id}`), room)
  } catch (error) {
    throw error
  }
}

export const getRooms = async (userId: string) => {
  try {
    const roomsRef = collection(db, `users/${userId}/rooms`)
    const snapshot = await getDocs(roomsRef)
    return snapshot.docs.map(doc => doc.data() as Room)
  } catch (error) {
    throw error
  }
}

export const updateRoom = async (userId: string, roomId: string, updates: Partial<Room>) => {
  try {
    await updateDoc(doc(db, `users/${userId}/rooms/${roomId}`), updates)
  } catch (error) {
    throw error
  }
}

export const deleteRoom = async (userId: string, roomId: string) => {
  try {
    await deleteDoc(doc(db, `users/${userId}/rooms/${roomId}`))
  } catch (error) {
    throw error
  }
}

// Task functions
export const createTask = async (userId: string, task: Task) => {
  try {
    await setDoc(doc(db, `users/${userId}/tasks/${task.id}`), task)
  } catch (error) {
    throw error
  }
}

export const getTasks = async (userId: string) => {
  try {
    const tasksRef = collection(db, `users/${userId}/tasks`)
    const snapshot = await getDocs(tasksRef)
    return snapshot.docs.map(doc => doc.data() as Task)
  } catch (error) {
    throw error
  }
}

export const updateTask = async (userId: string, taskId: string, updates: Partial<Task>) => {
  try {
    await updateDoc(doc(db, `users/${userId}/tasks/${taskId}`), updates)
  } catch (error) {
    throw error
  }
}

export const deleteTask = async (userId: string, taskId: string) => {
  try {
    await deleteDoc(doc(db, `users/${userId}/tasks/${taskId}`))
  } catch (error) {
    throw error
  }
}

// Get tasks by room
export const getTasksByRoom = async (userId: string, roomId: string) => {
  try {
    const tasksRef = collection(db, `users/${userId}/tasks`)
    const q = query(tasksRef, where("roomId", "==", roomId))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => doc.data() as Task)
  } catch (error) {
    throw error
  }
} 