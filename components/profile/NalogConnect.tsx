'use client'

import { useState, useEffect } from 'react'
import { Smartphone, Check, AlertCircle, ExternalLink, Eye, EyeOff } from 'lucide-react'

interface NalogCredentials {
  inn: string
  token: string
}

const STORAGE_KEY = 'sb_nalog_creds'

export default function NalogConnect() {
  const [creds, setCreds] = useState<NalogCredentials>({ inn: '', token: '' })
  const [saved, setSaved] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'ok' | 'error' | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setCreds(JSON.parse(raw) as NalogCredentials)
    } catch { /* ignore */ }
  }, [])

  const isConfigured = !!(creds.inn && creds.token)

  function saveCreds() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(creds))
    setSaved(true)
    setTestResult(null)
    setTimeout(() => setSaved(false), 2000)
  }

  function clearCreds() {
    localStorage.removeItem(STORAGE_KEY)
    setCreds({ inn: '', token: '' })
    setTestResult(null)
  }

  async function testConnection() {
    if (!creds.inn || !creds.token) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('https://lknpd.nalog.ru/api/v1/taxpayer', {
        headers: { Authorization: `Bearer ${creds.token}`, Inn: creds.inn },
      })
      setTestResult(res.ok ? 'ok' : 'error')
    } catch {
      setTestResult('error')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">Мой налог (ФНС)</p>
          <p className="text-xs text-gray-400">Автоматическая выдача чеков НПД</p>
        </div>
        {isConfigured && (
          <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Подключено</span>
        )}
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 space-y-1.5">
          <p className="font-bold">Как получить токен:</p>
          <ol className="list-decimal list-inside space-y-1 text-amber-700">
            <li>Войдите в приложение «Мой налог» на телефоне</li>
            <li>Профиль → Прочее → Партнёры → API-партнёры</li>
            <li>Создайте токен для стороннего сервиса</li>
            <li>Скопируйте ИНН и Bearer-токен сюда</li>
          </ol>
          <a
            href="https://lknpd.nalog.ru"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-amber-800 font-semibold hover:underline mt-1"
          >
            Открыть lknpd.nalog.ru <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">ИНН</label>
            <input
              type="text"
              value={creds.inn}
              onChange={(e) => setCreds({ ...creds, inn: e.target.value })}
              placeholder="123456789012"
              maxLength={12}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">API-токен</label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={creds.token}
                onChange={(e) => setCreds({ ...creds, token: e.target.value })}
                placeholder="Bearer токен из приложения"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {testResult === 'ok' && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">
            <Check className="w-4 h-4" /> Соединение установлено успешно
          </div>
        )}
        {testResult === 'error' && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 rounded-xl px-3 py-2">
            <AlertCircle className="w-4 h-4" /> Ошибка соединения. Проверьте ИНН и токен.
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={testConnection}
            disabled={!creds.inn || !creds.token || testing}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-2xl text-sm font-semibold hover:bg-gray-200 disabled:opacity-40 transition-colors"
          >
            {testing ? 'Проверка...' : 'Проверить связь'}
          </button>
          <button
            onClick={saveCreds}
            disabled={!creds.inn || !creds.token}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-2xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            {saved ? <><Check className="w-4 h-4" /> Сохранено</> : 'Сохранить'}
          </button>
          {isConfigured && (
            <button onClick={clearCreds} className="px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-2xl text-sm font-medium transition-colors">
              Отключить
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
