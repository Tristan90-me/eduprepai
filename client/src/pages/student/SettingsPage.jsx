// SettingsPage.jsx — change "Settings" to match the file name
import AppShell from '../../components/layout/AppShell'

export default function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Coming soon">
      <div className="max-w-5xl mx-auto">
        <div className="card text-center py-20">
          <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center
                          justify-center mx-auto mb-4">
            <span className="text-3xl">🚧</span>
          </div>
          <h2
            className="text-xl font-semibold text-slate-800 mb-2"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Settings
          </h2>
          <p className="text-slate-500 text-sm">
            This module is coming in an upcoming step.
          </p>
        </div>
      </div>
    </AppShell>
  )
}