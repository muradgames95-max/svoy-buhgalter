'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'

export default function TaxNotifySettings() {
  const { data: session } = useSession()
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!session) { setLoading(false); return }
    fetch('/api/user/settings')
      .then((r) => r.json())
      .then((d) => { if (typeof d.notifyTax === 'boolean') setEnabled(d.notifyTax) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session])

  async function toggle() {
    if (!session) return
    const next = !enabled
    setSaving(true)
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifyTax: next }),
      })
      if (res.ok) setEnabled(next)
    } finally {
      setSaving(false)
    }
  }

  if (!session) return null
  if (loading) return null

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Email-напоминания о налоге</p>
            <p className="text-xs text-gray-500 mt-0.5">Письмо 23-го числа с суммой налога НПД</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-4 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          {enabled
            ? 'Получаете напоминание с расчётом налога — за 5 дней до 28-го.'
            : 'Включите, чтобы получать напоминание об уплате налога НПД на email.'}
        </p>
        <button
          onClick={toggle}
          disabled={saving}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
            enabled ? 'bg-violet-600' : 'bg-gray-200'
          } ${saving ? 'opacity-60' : ''}`}
          role="switch"
          aria-checked={enabled}
        >
          {saving ? (
            <Loader2 className="absolute inset-0 m-auto w-4 h-4 text-white animate-spin" />
          ) : (
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          )}
        </button>
      </div>
      {!enabled && (
        <div className="px-5 pb-4">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <BellOff className="w-3.5 h-3.5" />
            Напоминания отключены — вы не получаете писем о налоге
          </p>
        </div>
      )}
    </div>
  )
}
