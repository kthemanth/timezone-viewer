// src/components/ui/GlassCard.jsx
const LEVELS = {
  1: 'bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm',
  2: 'bg-indigo-500/[0.08] border border-indigo-500/20 backdrop-blur-md',
  3: 'bg-indigo-500/[0.15] border border-indigo-500/35 backdrop-blur-xl',
}
const RADII = {
  sm: 'rounded-[10px]',
  md: 'rounded-2xl',
  lg: 'rounded-[20px]',
}

export default function GlassCard({
  level = 2,
  radius = 'md',
  hover = false,
  className = '',
  children,
  ...props
}) {
  return (
    <div
      className={`
        ${LEVELS[level]}
        ${RADII[radius]}
        ${hover ? 'transition-all duration-[250ms] ease-out hover:-translate-y-[3px] hover:border-indigo-500/40 hover:shadow-[0_12px_32px_rgba(99,102,241,0.2)]' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}
