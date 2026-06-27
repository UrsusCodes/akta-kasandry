import { useEffect, useState } from 'react'

const QUERY = '(min-width: 1024px)' // Tailwind lg — the two-column breakpoint

/** True on the desktop two-column layout. Safe in jsdom (no matchMedia → false). */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches,
  )
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(QUERY)
    const handler = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', handler)
    setIsDesktop(mq.matches)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}
