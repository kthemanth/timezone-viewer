import { useNavigate } from 'react-router-dom'
import { GlassButton } from '../components/ui'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans" style={{ background: '#06061a' }}>
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px]" style={{ background: 'radial-gradient(ellipse,rgba(99,102,241,0.1) 0%,transparent 65%)', borderRadius: '50%' }} />
      <div
        className="relative z-10 text-center"
        style={{
          fontSize: 80,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          background: 'linear-gradient(135deg,#6366f1,#a855f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
        }}
      >
        404
      </div>
      <div className="relative z-10 text-xl font-bold text-slate-300 mt-4 mb-2">Page not found</div>
      <div className="relative z-10 text-sm text-slate-600 mb-8">This page doesn't exist or you don't have access.</div>
      <GlassButton variant="ghost" onClick={() => navigate('/')}>← Back to calendar</GlassButton>
    </div>
  )
}
