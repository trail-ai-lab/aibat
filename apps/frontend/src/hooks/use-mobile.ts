import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024
const TOOLBAR_COLLAPSE_BREAKPOINT = 1100 // More aggressive breakpoint to prevent button overlap

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsTablet(window.innerWidth < TABLET_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsTablet(window.innerWidth < TABLET_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isTablet
}

export function useToolbarCollapse() {
  const [shouldCollapse, setShouldCollapse] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${TOOLBAR_COLLAPSE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setShouldCollapse(window.innerWidth < TOOLBAR_COLLAPSE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setShouldCollapse(window.innerWidth < TOOLBAR_COLLAPSE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!shouldCollapse
}
