import AppShell from '@/components/layout/AppShell'
import InvoiceManager from '@/components/invoices/InvoiceManager'

export const metadata = { title: 'Счета — Свой Бухгалтер' }

export default function InvoicesPage() {
  return (
    <AppShell>
      <InvoiceManager />
    </AppShell>
  )
}
