// src/components/ui/GlassModal.jsx
import { useEffect } from 'react'

export default function GlassModal({ open, onClose, children, maxWidth = '480px' }) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = e => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(6,6,26,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className="w-full animate-[modal-enter_0.25s_ease_both]"
        style={{ maxWidth }}
      >
        <div
          className="rounded-[20px] p-6"
          style={{
            background: 'rgba(13,13,43,0.92)',
            border: '1px solid rgba(99,102,241,0.35)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 0 60px rgba(99,102,241,0.1), 0 24px 48px rgba(0,0,0,0.5)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
