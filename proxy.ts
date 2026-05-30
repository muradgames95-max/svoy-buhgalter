import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password', '/reset-password', '/chat', '/onboarding']

export const proxy = auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth?.user

  const isPublic =
    PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p)) ||
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname === '/'

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/overview', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|icons/).*)'],
}
