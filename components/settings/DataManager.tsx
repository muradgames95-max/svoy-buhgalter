'use client'

import { useRef, useState } from 'react'
import { Download, Upload, Trash2, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { STORAGE_KEYS } from '@/lib/storage'
import { cn } from '@/lib/utils'

type Status = 'idle' | 'success' | 'error'

const ALL_KEYS = Object.values(STORAGE_KEYS)

function getBackupData(): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  ALL_KEYS.forEach((key) => {
    const raw = localStorage.getItem(key)
    if (raw !== null) {
      try { data[key] = JSON.parse(raw) } catch { data[key] = raw }
    }
  })
  return data
}

function countRecords(data: Record<string, unknown>): { incomes: number; expenses: number; clients: number; docs: number } {
  return {
    incomes: (data[STORAGE_KEYS.INCOMES] as unknown[])?.length ?? 0,
    expenses: (data[STORAGE_KEYS.EXPENSES] as unknown[])?.length ?? 0,
    clients: (data[STORAGE_KEYS.CLIENTS] as unknown[])?.length ?? 0,
    docs: (data[STORAGE_KEYS.DOCUMENTS] as unknown[])?.length ?? 0,
  }
}

export default function DataManager() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<Status>('idle')
  const [importMsg, setImportMsg] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  function exportData() {
    const data = getBackupData()
    const counts = countRecords(data)
    const meta = {
      exportedAt: new Date().toISOString(),
      version: 1,
      summary: counts,
    }
    const blob = new Blob(
      [JSON.stringify({ __meta: meta, ...data }, null, 2)],
      { type: 'application/json;charset=utf-8' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `свой-бухгалтер-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const raw = evt.target?.result as string
        const parsed = JSON.parse(raw) as Record<string, unknown>
        let restored = 0
        ALL_KEYS.forEach((key) => {
          if (parsed[key] !== undefined) {
            localStorage.setItem(key, JSON.stringify(parsed[key]))
            restored++
          }
        })
        if (restored === 0) {
          setImportStatus('error')
          setImportMsg('Файл не содержит данных приложения')
        } else {
          const counts = countRecords(parsed)
          setImportStatus('success')
          setImportMsg(
            `Восстановлено: ${counts.incomes} доходов, ${counts.expenses} расходов, ${counts.clients} клиентов, ${counts.docs} документов`
          )
          setTimeout(() => window.location.reload(), 1800)
        }
      } catch {
        setImportStatus('error')
        setImportMsg('Неверный формат файла')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function resetAllData() {
    ALL_KEYS.forEach((key) => localStorage.removeItem(key))
    setConfirmReset(false)
    setResetDone(true)
    setTimeout(() => window.location.reload(), 1500)
  }

  const localCounts = typeof window !== 'undefined' ? countRecords(getBackupData()) : null

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/60">
        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">Резервная копия данных</p>
          <p className="text-xs text-gray-400">Сохраните данные перед сменой устройства или браузера</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Current data summary */}
        {localCounts && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Доходов', value: localCounts.incomes },
              { label: 'Расходов', value: localCounts.expenses },
              { label: 'Клиентов', value: localCounts.clients },
              { label: 'Документов', value: localCounts.docs },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-2xl px-3 py-3 text-center border border-gray-100">
                <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
                <p className="text-[10px] text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Export */}
        <button
          onClick={exportData}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold text-sm transition-colors shadow-sm shadow-emerald-200"
        >
          <Download className="w-4 h-4 shrink-0" />
          <div className="text-left">
            <p>Скачать резервную копию</p>
            <p className="text-[11px] font-normal text-emerald-200">Сохранит все данные в файл .json</p>
          </div>
        </button>

        {/* Import */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => { setImportStatus('idle'); fileInputRef.current?.click() }}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-2xl font-semibold text-sm transition-colors"
          >
            <Upload className="w-4 h-4 shrink-0" />
            <div className="text-left">
              <p>Восстановить из файла</p>
              <p className="text-[11px] font-normal text-indigo-400">Загрузите ранее сохранённый .json</p>
            </div>
          </button>

          {importStatus !== 'idle' && (
            <div className={cn(
              'mt-2 flex items-start gap-2 px-4 py-3 rounded-2xl text-sm',
              importStatus === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            )}>
              {importStatus === 'success'
                ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
              <p>{importMsg}{importStatus === 'success' ? ' · перезагрузка...' : ''}</p>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="border border-red-100 rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5 bg-red-50 border-b border-red-100">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wide">Зона риска</p>
          </div>
          <div className="px-4 py-3.5">
            {!confirmReset && !resetDone && (
              <button
                onClick={() => setConfirmReset(true)}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Удалить все данные приложения
              </button>
            )}

            {confirmReset && (
              <div className="space-y-3">
                <p className="text-sm text-red-700 font-medium">
                  Это удалит все доходы, расходы, клиентов и документы. Действие необратимо.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={resetAllData}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors"
                  >
                    Да, удалить всё
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}

            {resetDone && (
              <p className="text-sm text-gray-500">Данные удалены · перезагрузка...</p>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center leading-relaxed">
          Данные хранятся только на вашем устройстве. Рекомендуем делать резервную копию раз в неделю.
        </p>
      </div>
    </div>
  )
}
