// src/components/ui/GlassToggle.jsx
export default function GlassToggle({ checked = false, onChange, label, className = '' }) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange?.(!checked)}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onChange?.(!checked)}
      className={`flex items-center justify-between gap-2 cursor-pointer select-none ${className}`}
    >
      {label && <span className="text-[11px] font-semibold text-slate-400">{label}</span>}
      <div
        className={`
          relative w-10 h-[22px] rounded-full border
          transition-all duration-[250ms] ease-out
          ${checked
            ? 'bg-gradient-to-r from-indigo-500 to-violet-500 border-transparent'
            : 'bg-white/[0.07] border-white/[0.12]'
          }
        `}
      >
        <div
          className="absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow-sm"
          style={{
            transform: checked ? 'translateX(18px)' : 'translateX(0)',
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      </div>
    </div>
  )
}
