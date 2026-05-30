'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Gift, Copy, Check, Share2 } from 'lucide-react'

function generateCode(seed: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = (h * 0x01000193) >>> 0
  }
  return h.toString(36).toUpperCase().padStart(6, '0').slice(0, 6)
}

function getOrCreateLocalId(): string {
  const key = 'sb_local_uid'
  let id = localStorage.getItem(key)
  if (!id) {
    id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    localStorage.setItem(key, id)
  }
  return id
}

export default function ReferralCard() {
  const { data: session } = useSession()
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    const seed = session?.user?.id ?? getOrCreateLocalId()
    setCode(generateCode(seed))
  }, [session])

  const referralLink = `https://svoy-buhgalter.ru/signup?ref=${code}`

  function copyCode() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function copyLink() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    })
  }

  if (!code) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
          <Gift className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">Реферальная программа</h3>
          <p className="text-xs text-gray-400">Пригласите друга и получите бонус</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-2">Ваш реферальный код</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl font-bold tracking-[0.2em] text-indigo-700 font-mono">{code}</span>
            <button
              onClick={copyCode}
              className="p-2 rounded-xl bg-white border border-indigo-200 text-indigo-500 hover:bg-indigo-50 transition-colors shadow-sm"
              title="Копировать код"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">Реферальная ссылка</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-600 truncate font-mono">
              {referralLink}
            </div>
            <button
              onClick={copyLink}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              {copiedLink ? 'Скопировано' : 'Копировать'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Приглашено', value: '0', color: 'text-gray-700' },
            { label: 'Зарегистрировалось', value: '0', color: 'text-indigo-600' },
            { label: 'Бонус', value: '0 ₽', color: 'text-emerald-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-gray-400 text-center leading-relaxed">
          Когда друг оформит подписку по вашей ссылке, вы получите 1 месяц тарифа «Самозанятый» бесплатно.
        </p>
      </div>
    </div>
  )
}
