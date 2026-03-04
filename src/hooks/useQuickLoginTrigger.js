import { useState, useEffect, useRef, useCallback } from 'react'

const STORAGE_KEY = 'quickLoginDismissedAt'
const DISMISS_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
const MIN_TIME_TRIGGER = 5000 // 5 seconds
const MAX_TIME_TRIGGER = 10000 // 10 seconds
const SCROLL_THRESHOLD = 0.10 // 10% of page

/**
 * Hook to detect when to show quick login popup
 * Triggers on scroll (10%) OR time (5-10s), whichever comes first
 * Respects 24-hour dismiss period
 */
export const useQuickLoginTrigger = () => {
  const [shouldShowPopup, setShouldShowPopup] = useState(false)
  const hasTriggeredRef = useRef(false)
  const timeoutRef = useRef(null)

  // Check if popup was recently dismissed
  const isRecentlyDismissed = useCallback(() => {
    try {
      const dismissedAt = localStorage.getItem(STORAGE_KEY)
      if (!dismissedAt) return false

      const dismissedTime = parseInt(dismissedAt, 10)
      const now = Date.now()

      return (now - dismissedTime) < DISMISS_DURATION
    } catch (error) {
      console.error('Error checking localStorage:', error)
      return false
    }
  }, [])

  // Mark popup as dismissed
  const dismissPopup = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString())
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
    setShouldShowPopup(false)
  }, [])

  // Handle successful login - clear dismiss flag so it won't show again in this session
  const onLoginSuccess = useCallback(() => {
    hasTriggeredRef.current = true
    setShouldShowPopup(false)
    // Don't set localStorage - successful login means we don't need to show it
  }, [])

  useEffect(() => {
    // Don't run on server
    if (typeof window === 'undefined') return

    // Check if already logged in
    const token = localStorage.getItem('customerToken')
    if (token) {
      hasTriggeredRef.current = true
      return
    }

    // Check if recently dismissed
    if (isRecentlyDismissed()) {
      hasTriggeredRef.current = true
      return
    }

    // Check if already triggered in this session
    if (hasTriggeredRef.current) return

    let scrollTriggered = false

    // Scroll detection with throttling
    const handleScroll = () => {
      if (hasTriggeredRef.current || scrollTriggered) return

      const scrollY = window.scrollY
      const docHeight = document.body.scrollHeight - window.innerHeight

      // Avoid division by zero
      if (docHeight <= 0) return

      const scrollPercent = scrollY / docHeight

      if (scrollPercent >= SCROLL_THRESHOLD) {
        scrollTriggered = true
        hasTriggeredRef.current = true

        // Clear time trigger if scroll triggers first
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }

        setShouldShowPopup(true)

        // Remove scroll listener after trigger
        window.removeEventListener('scroll', throttledScroll)
      }
    }

    // Throttle scroll handler to run max once every 100ms
    let ticking = false
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    // Add scroll listener
    window.addEventListener('scroll', throttledScroll, { passive: true })

    // Time trigger - random between 5-10 seconds
    const randomDelay = MIN_TIME_TRIGGER + Math.random() * (MAX_TIME_TRIGGER - MIN_TIME_TRIGGER)

    timeoutRef.current = setTimeout(() => {
      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true
        setShouldShowPopup(true)

        // Remove scroll listener since time triggered first
        window.removeEventListener('scroll', throttledScroll)
      }
    }, randomDelay)

    // Cleanup
    return () => {
      window.removeEventListener('scroll', throttledScroll)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [isRecentlyDismissed])

  return {
    shouldShowPopup,
    dismissPopup,
    onLoginSuccess
  }
}

export default useQuickLoginTrigger
