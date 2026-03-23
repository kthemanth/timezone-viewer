// src/components/ui/GlassBadge.jsx
const VARIANTS = {
  indigo:   'bg-indigo-500/20 border border-indigo-500/35 text-indigo-300',
  violet:   'bg-violet-500/20 border border-violet-500/35 text-violet-300',
  fuchsia:  'bg-fuchsia-500/20 border border-fuchsia-500/35 text-fuchsia-300',
  success:  'bg-emerald-500/20 border border-emerald-500/35 text-emerald-300',
  warn:     'bg-amber-500/20 border border-amber-500/35 text-amber-300',
  error:    'bg-red-500/20 border border-red-500/35 text-red-300',
}

export default function GlassBadge({ variant = 'indigo', className = '', children }) {
  return (
    <span className={`
      inline-flex items-center gap-1
      rounded-full px-[10px] py-[3px]
      text-[10px] font-semibold
      ${VARIANTS[variant]}
      ${className}
    `}>
      {children}
    </span>
  )
}
