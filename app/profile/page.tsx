import AppShell from '@/components/layout/AppShell'
import ProfileEditor from '@/components/profile/ProfileEditor'
import DataManager from '@/components/settings/DataManager'
import NalogConnect from '@/components/profile/NalogConnect'
import { UserCircle } from 'lucide-react'

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="min-h-full bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 pb-10">
          <div className="relative rounded-b-3xl overflow-hidden bg-gradient-to-br from-gray-950 to-indigo-950 px-6 pt-8 pb-7 mb-6">
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
            <div className="relative flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900 shrink-0">
                <UserCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Профиль</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  Данные автоматически подставляются в документы
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <ProfileEditor />
            <NalogConnect />
            <DataManager />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
