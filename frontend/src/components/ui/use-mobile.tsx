import * as React from 'react'

const MOBILE_BREAKPOINT = 768

const getMatch = () =>
  typeof window !== 'undefined' &&
  window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches

export function useIsMobile() {
  // Lazy-initialize from the actual viewport so the FIRST render is already
  // correct (see hooks/use-mobile.ts — same fix for the post-login layout flash).
  const [isMobile, setIsMobile] = React.useState<boolean>(getMatch)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    mql.addEventListener('change', onChange)
    window.addEventListener('resize', onChange)
    onChange()
    return () => {
      mql.removeEventListener('change', onChange)
      window.removeEventListener('resize', onChange)
    }
  }, [])

  return isMobile
}
