// src/components/ui/GlassButton.jsx
const VARIANTS = {
  primary: `
    bg-gradient-to-br from-indigo-500 to-violet-500 text-white border-0
    shadow-[0_0_0px_rgba(99,102,241,0)]
    hover:shadow-[0_0_28px_rgba(99,102,241,0.65),0_4px_16px_rgba(0,0,0,0.3)]
    hover:-translate-y-px active:translate-y-0
  `,
  secondary: `
    bg-indigo-500/[0.12] border border-indigo-500/30 text-indigo-300
    hover:bg-indigo-500/20 hover:border-indigo-500/50
  `,
  ghost: `
    bg-transparent border border-white/[0.08] text-slate-400
    hover:bg-indigo-500/[0.08] hover:border-indigo-500/30 hover:text-indigo-300
  `,
  danger: `
    bg-red-500/[0.12] border border-red-500/30 text-red-300
    hover:bg-red-500/20 hover:border-red-500/50
  `,
  cat: `
    bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white border-0
    shadow-[0_0_0px_rgba(217,70,239,0)]
    hover:shadow-[0_0_28px_rgba(217,70,239,0.65),0_4px_16px_rgba(0,0,0,0.3)]
    hover:-translate-y-px active:translate-y-0
  `,
}

export default function GlassButton({
  variant = 'primary',
  disabled = false,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-[10px] px-4 py-2 text-sm font-semibold
        transition-all duration-[250ms] ease-out
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
        ${VARIANTS[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}
