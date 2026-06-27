import * as React from 'react'

const MOBILE_BREAKPOINT = 768

const getMatch = () =>
  typeof window !== 'undefined' &&
  window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches

export function useIsMobile() {
  // Lazy-initialize from the actual viewport so the FIRST render is already
  // correct. Initializing to false/undefined committed a desktop layout on the
  // post-OAuth client navigation, which only corrected on a manual refresh.
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
