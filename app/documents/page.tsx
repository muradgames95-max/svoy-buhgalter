import AppShell from '@/components/layout/AppShell'
import DocumentGenerator from '@/components/documents/DocumentGenerator'
import { FileText } from 'lucide-react'

export default function DocumentsPage() {
  return (
    <AppShell>
      <div className="min-h-full bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 pb-10">
          <div className="relative rounded-b-3xl overflow-hidden bg-gradient-to-br from-gray-950 to-emerald-950 px-6 pt-8 pb-7 mb-6">
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
            <div className="relative flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900 shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Генератор документов</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  Акт, договор или счёт — за 30 секунд с помощью AI
                </p>
              </div>
            </div>
          </div>
          <DocumentGenerator />
        </div>
      </div>
    </AppShell>
  )
}
