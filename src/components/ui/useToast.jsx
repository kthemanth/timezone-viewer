// src/components/ui/useToast.jsx
import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ message, sub, variant = 'success', duration = 3000 }) => {
    const id = ++_id
    setToasts(prev => {
      // Max 3 toasts — drop oldest
      const next = prev.length >= 3 ? prev.slice(1) : prev
      return [...next, { id, message, sub, variant, duration, leaving: false }]
    })
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 200)
    }, duration)
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, toasts, setToasts }}>
      {children}
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
