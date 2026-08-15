import { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar  from './TopBar'

// ── AppShell ───────────────────────────────────────────────────
// The authenticated layout wrapper.
// Every logged-in page wraps its content in this component.
//
// Usage:
//   <AppShell title="Dashboard" subtitle="Your study overview">
//     <YourPageContent />
//   </AppShell>
export default function AppShell({ children, title, subtitle }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main content — pushed right by sidebar width on desktop */}
      <div
        className="min-h-screen flex flex-col"
        style={{ paddingLeft: 'var(--sidebar-width)' }}
      >
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          title={title}
          subtitle={subtitle}
        />

        {/* Actual page content */}
        <main
          className="flex-1 p-5 md:p-7 animate-fade-in"
          style={{ marginTop: 'var(--topbar-height)' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}