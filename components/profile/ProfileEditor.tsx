'use client'

import { useState, useEffect } from 'react'
import { Check, User, Building2, CreditCard, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage'

export interface UserProfile {
  name: string
  inn: string
  executorStatus: string
  activity: string
  bankName: string
  bik: string
  account: string
  phone: string
  email: string
}

const STATUS_OPTIONS = ['Самозанятый (НПД)', 'ИП на УСН', 'ИП на ОСНО', 'ИП на патенте', 'ООО']

const EMPTY: UserProfile = {
  name: '', inn: '', executorStatus: 'Самозанятый (НПД)',
  activity: '', bankName: '', bik: '', account: '', phone: '', email: '',
}

function Field({ label, value, onChange, placeholder = '', type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
      />
    </div>
  )
}

export default function ProfileEditor() {
  const [profile, setProfile] = useState<UserProfile>(EMPTY)
  const [saved, setSaved] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = loadFromStorage<Partial<UserProfile>>(STORAGE_KEYS.PROFILE, {})
    setProfile({ ...EMPTY, ...stored })
    setHydrated(true)
  }, [])

  function set(key: keyof UserProfile, value: string) {
    setProfile((p) => ({ ...p, [key]: value }))
  }

  function saveProfile() {
    saveToStorage(STORAGE_KEYS.PROFILE, profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (!hydrated) return null

  return (
    <div className="space-y-4">
      {/* Personal */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
            <User className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="font-semibold text-gray-900 text-sm">Личные данные</p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Имя / название ИП / ООО" value={profile.name} onChange={(v) => set('name', v)} placeholder="Иванов Иван Иванович" />
          <Field label="ИНН" value={profile.inn} onChange={(v) => set('inn', v)} placeholder="123456789012" />
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Налоговый статус</label>
            <select
              value={profile.executorStatus}
              onChange={(e) => set('executorStatus', e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <Field label="Вид деятельности" value={profile.activity} onChange={(v) => set('activity', v)} placeholder="Разработка / дизайн / консалтинг" />
          <Field label="Телефон" value={profile.phone} onChange={(v) => set('phone', v)} placeholder="+7 999 123-45-67" type="tel" />
          <Field label="Email" value={profile.email} onChange={(v) => set('email', v)} placeholder="ivan@example.com" type="email" />
        </div>
      </div>

      {/* Bank */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
          <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Банковские реквизиты</p>
            <p className="text-xs text-gray-400">Автоматически подставляются в счета</p>
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Банк" value={profile.bankName} onChange={(v) => set('bankName', v)} placeholder="Тинькофф" />
          <Field label="БИК" value={profile.bik} onChange={(v) => set('bik', v)} placeholder="044525974" />
          <Field label="Расчётный счёт" value={profile.account} onChange={(v) => set('account', v)} placeholder="40802810..." />
        </div>
      </div>

      {/* Save */}
      <button
        onClick={saveProfile}
        className={cn(
          'w-full py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2',
          saved
            ? 'bg-emerald-600 text-white'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200'
        )}
      >
        {saved ? <><Check className="w-4 h-4" />Сохранено!</> : <><Sparkles className="w-4 h-4" />Сохранить профиль</>}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Данные хранятся локально на вашем устройстве и автоматически подставляются в документы
      </p>
    </div>
  )
}
