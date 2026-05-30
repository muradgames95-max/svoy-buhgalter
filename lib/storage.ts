export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new CustomEvent('sb:storage-updated', { detail: { key } }))
    window.dispatchEvent(new CustomEvent('svoy-storage-updated', { detail: { key } }))
  } catch (e) {
    console.error('[storage] saveToStorage failed:', key, e)
  }
}

export const STORAGE_KEYS = {
  INCOMES: 'sb_incomes',
  EXPENSES: 'sb_expenses',
  CLIENTS: 'sb_clients',
  PROFILE: 'sb_profile',
  DOCUMENTS: 'sb_documents',
  SETTINGS: 'sb_settings',
  ONBOARDING_DONE: 'sb_onboarding_done',
  MONTHLY_GOAL: 'sb_monthly_goal',
  ANNUAL_GOAL: 'sb_annual_goal',
  TAX_PAID: 'sb_tax_paid',
  CHAT_HISTORY: 'sb_chat_history',
  NALOG_CREDS: 'sb_nalog_creds',
  NOTES: 'sb_notes',
  EXPENSE_BUDGETS: 'sb_expense_budgets',
} as const

export const ARRAY_STORAGE_KEYS: ReadonlySet<string> = new Set([
  'sb_incomes',
  'sb_expenses',
  'sb_clients',
  'sb_documents',
  'sb_chat_history',
])
