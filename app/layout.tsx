import type { Metadata, Viewport } from 'next'
import './globals.css'
import SessionProvider from '@/components/providers/SessionProvider'

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Свой Бухгалтер — AI-налоговый помощник для самозанятых и ИП',
  description:
    'Умный AI-ассистент по налогам для самозанятых и ИП. Поможет разобраться в НПД, УСН, изменениях 2026 года, рассчитает налоги и напомнит о дедлайнах.',
  keywords: ['самозанятый', 'ИП', 'налоги', 'НПД', 'УСН', 'бухгалтер', 'налоговый консультант', '2026'],
  authors: [{ name: 'Свой Бухгалтер' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Свой Бухгалтер',
  },
  openGraph: {
    title: 'Свой Бухгалтер — AI-налоговый помощник',
    description: 'НПД, УСН, ОСНО — объясняем на русском. Считаем налоги. Напоминаем о дедлайнах.',
    type: 'website',
    locale: 'ru_RU',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Свой Бухгалтер" />
      </head>
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
