'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import QuickAdd from './QuickAdd'
import MobileBottomNav from './MobileBottomNav'
import DataSync from '@/components/sync/DataSync'
import PWAProvider from '@/components/providers/PWAProvider'
import NotificationBanner from '@/components/notifications/NotificationBanner'
import { Menu, X, Sparkles } from 'lucide-react'
import { loadFromStorage, STORAGE_KEYS } from '@/lib/storage'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const done = loadFromStorage<boolean>(STORAGE_KEYS.ONBOARDING_DONE, false)
    if (!done && pathname !== '/onboarding') {
      router.replace('/onboarding')
    }
  }, [pathname, router])

  // Redirect / to /overview when inside AppShell
  useEffect(() => {
    if (pathname === '/') router.replace('/overview')
  }, [pathname, router])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar desktop */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Sidebar mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-40 lg:hidden transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden h-14 bg-gray-950 border-b border-white/5 flex items-center px-4 gap-3">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">Свой Бухгалтер</span>
          </div>
          {open && (
            <button
              onClick={() => setOpen(false)}
              className="ml-auto p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">{children}</main>
      </div>
      <QuickAdd />
      <MobileBottomNav />
      <DataSync />
      <PWAProvider />
      <NotificationBanner />
    </div>
  )
}
