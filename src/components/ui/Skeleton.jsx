// src/components/ui/Skeleton.jsx
export default function Skeleton({ width = '100%', height = '12px', className = '' }) {
  return (
    <div
      className={`rounded-md animate-shimmer ${className}`}
      style={{
        width,
        height,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(99,102,241,0.12) 50%, rgba(255,255,255,0.04) 100%)',
        backgroundSize: '800px 100%',
      }}
    />
  )
}
