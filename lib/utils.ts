import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRubles(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function calculateNPDTax(amount: number, isLegal: boolean): number {
  return Math.round(amount * (isLegal ? 0.06 : 0.04))
}

export function calculateUSNTax(income: number, expenses = 0, type: 'income' | 'income-expense' = 'income'): number {
  if (type === 'income') return Math.round(income * 0.06)
  const base = Math.max(income - expenses, 0)
  return Math.round(base * 0.15)
}
