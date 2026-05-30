import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './storage'

interface RecurringItem {
  id: string
  amount: number
  description: string
  date?: string
  recurring?: boolean
}

const RECURRING_CHECK_KEY = 'sb_recurring_check'

export function autoAddRecurring<T extends RecurringItem>(
  storageKey: string,
  extraFields: (item: T, dateStr: string) => Partial<T>
): void {
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastCheck = localStorage.getItem(`${RECURRING_CHECK_KEY}_${storageKey}`)
  if (lastCheck === monthKey) return

  const items = loadFromStorage<T[]>(storageKey, [])
  const recurring = items.filter((i) => i.recurring)
  if (recurring.length === 0) {
    localStorage.setItem(`${RECURRING_CHECK_KEY}_${storageKey}`, monthKey)
    return
  }

  const thisMonthItems = items.filter((i) => i.date?.startsWith(monthKey))

  const toAdd: T[] = []
  for (const r of recurring) {
    const alreadyExists = thisMonthItems.some(
      (i) => i.description === r.description && i.amount === r.amount
    )
    if (!alreadyExists) {
      const dateStr = `${monthKey}-01`
      toAdd.push({
        ...r,
        ...extraFields(r, dateStr),
        id: `rec_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        date: dateStr,
      } as T)
    }
  }

  if (toAdd.length > 0) {
    saveToStorage(storageKey, [...items, ...toAdd])
    window.dispatchEvent(new CustomEvent('sb:storage-updated', { detail: { key: storageKey } }))
  }

  localStorage.setItem(`${RECURRING_CHECK_KEY}_${storageKey}`, monthKey)
}
