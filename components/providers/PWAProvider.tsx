'use client'

import { useEffect } from 'react'
import { registerSW } from '@/lib/pwa'
import { checkDeadlineNotifications } from '@/lib/notifications'

export default function PWAProvider() {
  useEffect(() => {
    registerSW()
    // Only check notifications if permission already granted (banner handles the request)
    if (typeof window !== 'undefined' && Notification.permission === 'granted') {
      checkDeadlineNotifications()
    }
  }, [])

  return null
}
