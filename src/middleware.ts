import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/firebase/firebase'

// List of public paths that don't require authentication
const publicPaths = ['/login']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Check if the path is public
  const isPublicPath = publicPaths.includes(path)

  // Get the Firebase token from the request cookies
  const token = request.cookies.get('__firebase_auth_token')?.value

  // If the path is public and user is authenticated, redirect to home
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If the path is protected and user is not authenticated, redirect to login
  if (!isPublicPath && !token) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('__firebase_auth_token') // Clear any invalid token
    return response
  }

  return NextResponse.next()
}

// Configure which routes to run the middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 