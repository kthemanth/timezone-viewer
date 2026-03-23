// src/components/ui/GlassInput.jsx
export default function GlassInput({
  label,
  error,
  className = '',
  wrapperClassName = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-[5px] ${wrapperClassName}`}>
      {label && (
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.07em]">
          {label}
        </label>
      )}
      <input
        className={`
          w-full rounded-[10px] px-3 py-[9px] text-sm text-slate-100
          bg-white/[0.04] border
          ${error ? 'border-red-500/40' : 'border-white/10'}
          placeholder:text-slate-600
          focus:outline-none focus:border-indigo-500/50 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]
          transition-all duration-200
          ${className}
        `}
        {...props}
      />
      {error && (
        <span className="text-[11px] text-red-400 font-medium">{error}</span>
      )}
    </div>
  )
}
