// src/components/ui/Toast.jsx
import { createPortal } from 'react-dom'
import { useToast } from './useToast.jsx'

const ICONS = { success: '✅', error: '⚠️', warn: '⚠️', info: 'ℹ️' }
const BORDER = {
  success: 'rgba(16,185,129,0.35)',
  error:   'rgba(239,68,68,0.35)',
  warn:    'rgba(245,158,11,0.35)',
  info:    'rgba(99,102,241,0.35)',
}
const TEXT = {
  success: '#6ee7b7',
  error:   '#fca5a5',
  warn:    '#fcd34d',
  info:    '#a5b4fc',
}

export default function Toast() {
  const { toasts } = useToast()

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto ${t.leaving ? 'animate-slide-out' : 'animate-slide-in'}`}
          style={{
            background: 'rgba(13,13,43,0.92)',
            border: `1px solid ${BORDER[t.variant]}`,
            borderRadius: '12px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            minWidth: '240px',
            maxWidth: '320px',
          }}
        >
          <span style={{ fontSize: 16 }}>{ICONS[t.variant]}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{t.message}</div>
            {t.sub && <div style={{ fontSize: 10, color: TEXT[t.variant], marginTop: 1 }}>{t.sub}</div>}
          </div>
        </div>
      ))}
    </div>,
    document.body
  )
}
