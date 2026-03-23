// src/layouts/MainLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

const NAV_ITEMS = [
  { to: '/',    label: 'Month',  emoji: '📅' },
  { to: '/day', label: 'Day',    emoji: '⏱' },
  { to: '/cat', label: 'Tigrou', emoji: '🐱', fuchsia: true },
]

function AmbientOrbs() {
  return (
    <>
      <div
        className="pointer-events-none fixed top-0 left-1/4 w-[400px] h-[200px] -translate-y-1/2"
        style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)', borderRadius: '50%' }}
      />
      <div
        className="pointer-events-none fixed bottom-0 right-1/4 w-[300px] h-[200px] translate-y-1/2"
        style={{ background: 'radial-gradient(ellipse, rgba(168,85,247,0.08) 0%, transparent 70%)', borderRadius: '50%' }}
      />
    </>
  )
}

export default function MainLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const initial = user?.email?.[0]?.toUpperCase() ?? 'Q'

  async function handleSignOut() {
    await signOut()
    navigate('/signin')
  }

  return (
    <div className="min-h-screen bg-glass-base font-sans text-slate-200">
      <AmbientOrbs />

      {/* Frosted nav bar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4"
        style={{
          height: 52,
          background: 'rgba(6,6,26,0.75)',
          borderBottom: '1px solid rgba(99,102,241,0.18)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mr-2 flex-shrink-0">
          <img
            src="/favicon.png"
            alt="Quinn's Calendar"
            className="w-7 h-7 rounded-lg"
            style={{ boxShadow: '0 0 12px rgba(99,102,241,0.5)' }}
          />
          <span className="text-sm font-bold text-slate-100 tracking-tight hidden sm:block">Quinn's</span>
        </div>

        {/* Nav pills */}
        <div className="flex gap-1">
          {NAV_ITEMS.map(({ to, label, emoji, fuchsia }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-200 border
                ${isActive
                  ? fuchsia
                    ? 'bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-300 shadow-[0_0_8px_rgba(217,70,239,0.2)]'
                    : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                  : 'bg-transparent border-white/[0.06] text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                }
              `}
            >
              <span className="text-[11px]">{emoji}</span>
              {label}
            </NavLink>
          ))}
        </div>

        <div className="flex-1" />

        {/* Avatar / sign out */}
        <button
          onClick={handleSignOut}
          title="Sign out"
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 transition-opacity hover:opacity-80"
          style={{ background: 'linear-gradient(135deg,#6366f1,#d946ef)', boxShadow: '0 0 10px rgba(99,102,241,0.4)' }}
        >
          {initial}
        </button>
      </nav>

      {/* Gradient accent line below nav */}
      <div
        className="fixed top-[52px] left-0 right-0 z-50 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg,transparent,rgba(99,102,241,0.4),rgba(217,70,239,0.4),transparent)' }}
      />

      {/* Page content — padded below nav */}
      <main className="pt-[53px] min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
