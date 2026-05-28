'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { requestNotificationPermission, checkDeadlineNotifications } from '@/lib/notifications'

export default function NotificationBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'default') return
    const dismissed = localStorage.getItem('sb_notif_banner_dismissed')
    if (!dismissed) setShow(true)
  }, [])

  if (!show) return null

  async function allow() {
    const granted = await requestNotificationPermission()
    if (granted) checkDeadlineNotifications()
    setShow(false)
  }

  function dismiss() {
    localStorage.setItem('sb_notif_banner_dismissed', '1')
    setShow(false)
  }

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-gray-950 border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/30">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Уведомления о дедлайнах</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              Получайте напоминания за 7 дней до налоговых дедлайнов
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={allow}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Включить
              </button>
              <button
                onClick={dismiss}
                className="px-3 py-2 text-gray-400 hover:text-white text-xs font-medium rounded-xl hover:bg-white/5 transition-colors"
              >
                Не сейчас
              </button>
            </div>
          </div>
          <button onClick={dismiss} className="text-gray-600 hover:text-gray-300 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
