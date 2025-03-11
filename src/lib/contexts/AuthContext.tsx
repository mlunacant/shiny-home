"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from 'firebase/auth'
import { auth } from '@/lib/firebase/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Get the token and store it in a cookie
          const token = await user.getIdToken()
          Cookies.set('__firebase_auth_token', token, {
            expires: 14, // 14 days
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
          })
          setUser(user)
          // Only navigate if we're on the login page
          if (window.location.pathname === '/login') {
            router.push('/')
          }
        } else {
          // Remove the token when user is not authenticated
          Cookies.remove('__firebase_auth_token', { path: '/' })
          setUser(null)
          // Only navigate if we're not already on the login page
          if (window.location.pathname !== '/login') {
            router.push('/login')
          }
        }
      } catch (error) {
        console.error('Auth state change error:', error)
        Cookies.remove('__firebase_auth_token', { path: '/' })
        setUser(null)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
} 