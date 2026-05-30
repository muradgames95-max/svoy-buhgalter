'use client'

import { useEffect, useState } from 'react'
import { registerSW } from '@/lib/pwa'
import { checkDeadlineNotifications } from '@/lib/notifications'
import { WifiOff } from 'lucide-react'

export default function PWAProvider() {
  const [offline, setOffline] = useState(false)
  const [showOfflineBanner, setShowOfflineBanner] = useState(false)

  useEffect(() => {
    registerSW()
    if (typeof window !== 'undefined' && Notification.permission === 'granted') {
      checkDeadlineNotifications()
    }

    function handleOffline() {
      setOffline(true)
      setShowOfflineBanner(true)
    }
    function handleOnline() {
      setOffline(false)
      setTimeout(() => setShowOfflineBanner(false), 3000)
      // Trigger background sync
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((reg) => {
          // @ts-expect-error SyncManager not in all TS lib versions
          reg.sync.register('sb-sync').catch(() => null)
        })
      }
      window.dispatchEvent(new CustomEvent('sb:online'))
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    setOffline(!navigator.onLine)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!showOfflineBanner) return null

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl text-sm font-semibold transition-all ${
      offline ? 'bg-gray-900 text-white' : 'bg-emerald-600 text-white'
    }`}>
      <WifiOff className="w-4 h-4" />
      {offline ? 'Нет соединения — данные сохраняются локально' : 'Соединение восстановлено'}
    </div>
  )
}
