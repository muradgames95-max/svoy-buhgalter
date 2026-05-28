'use client'

import { useState } from 'react'
import { Mail, Send, Check, AlertCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { DEADLINES_2026, getDaysUntil } from '@/lib/deadlines'

export default function EmailReminder() {
  const { data: session } = useSession()
  const [email, setEmail] = useState(session?.user?.email ?? '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<'ok' | 'error' | null>(null)

  const upcoming = DEADLINES_2026.filter((d) => {
    const n = getDaysUntil(d.date)
    return n >= 0 && n <= 30
  })

  async function send() {
    if (!email || loading) return
    setLoading(true)
    setResult(null)

    const res = await fetch('/api/notify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, deadlines: upcoming }),
    })

    setLoading(false)
    setResult(res.ok ? 'ok' : 'error')
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Mail className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">Email-напоминание</p>
          <p className="text-xs text-gray-400">
            Дедлайны на 30 дней вперёд · {upcoming.length} событий
          </p>
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
            />
          </div>
          <button
            onClick={send}
            disabled={!email || loading || upcoming.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-2xl text-sm font-bold transition-colors"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Отправить
          </button>
        </div>

        {result === 'ok' && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">
            <Check className="w-4 h-4 shrink-0" />
            Письмо отправлено на {email}
          </div>
        )}
        {result === 'error' && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-xl px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Ошибка отправки. Проверьте RESEND_API_KEY в .env.local
          </div>
        )}

        <p className="text-xs text-gray-400">
          Настройте RESEND_API_KEY в .env.local для отправки писем через Resend.
        </p>
      </div>
    </div>
  )
}
