'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { STORAGE_KEYS, ARRAY_STORAGE_KEYS } from '@/lib/storage'

const SYNC_KEYS = [
  STORAGE_KEYS.INCOMES,
  STORAGE_KEYS.EXPENSES,
  STORAGE_KEYS.CLIENTS,
  STORAGE_KEYS.DOCUMENTS,
  STORAGE_KEYS.PROFILE,
  STORAGE_KEYS.SETTINGS,
  STORAGE_KEYS.CHAT_HISTORY,
  STORAGE_KEYS.NALOG_CREDS,
] as const

function getLocalPayload(): Record<string, string> {
  const payload: Record<string, string> = {}
  for (const key of SYNC_KEYS) {
    const stored = localStorage.getItem(key)
    payload[key] = stored ?? (ARRAY_STORAGE_KEYS.has(key) ? '[]' : '{}')
  }
  return payload
}

export default function DataSync() {
  const { data: session, status } = useSession()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadedRef = useRef(false)

  // Load from DB → localStorage on first sign-in
  useEffect(() => {
    if (status !== 'authenticated' || loadedRef.current) return
    loadedRef.current = true

    fetch('/api/data')
      .then((r) => r.json())
      .then((res: { data: Record<string, string> | null }) => {
        if (!res.data) return
        let hasData = false
        for (const [key, value] of Object.entries(res.data)) {
          if (value && value !== '[]' && value !== '{}') {
            localStorage.setItem(key, value)
            hasData = true
          }
        }
        window.dispatchEvent(new Event('sb:synced'))
        // Reload once so all components mount with fresh localStorage data.
        // sessionStorage flag prevents infinite reload loops.
        if (hasData && !sessionStorage.getItem('sb_initial_sync_done')) {
          sessionStorage.setItem('sb_initial_sync_done', '1')
          window.location.reload()
        }
      })
      .catch((e) => console.error('[DataSync] load failed', e))
  }, [status])

  // Debounced push to DB on any write
  useEffect(() => {
    if (status !== 'authenticated') return

    function handleUpdate() {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        const payload = getLocalPayload()
        fetch('/api/data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch((e) => console.error('[DataSync] save failed', e))
      }, 1500)
    }

    window.addEventListener('sb:storage-updated', handleUpdate)
    return () => {
      window.removeEventListener('sb:storage-updated', handleUpdate)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [status, session])

  return null
}
