const THEME_KEY = 'sb_theme'

export type Theme = 'light' | 'dark'

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return (localStorage.getItem(THEME_KEY) as Theme) ?? 'light'
}

export function setTheme(theme: Theme): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(THEME_KEY, theme)
  document.documentElement.classList.toggle('dark-mode', theme === 'dark')
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'light' ? 'dark' : 'light'
  setTheme(next)
  return next
}

export function initTheme(): void {
  if (typeof window === 'undefined') return
  const saved = getTheme()
  document.documentElement.classList.toggle('dark-mode', saved === 'dark')
}
