export function getSectionId(hash = '') {
  const normalized = hash.startsWith('/#') ? hash.slice(2) : hash
  return normalized.startsWith('#') ? normalized.slice(1) : normalized
}

export function scrollToSection(hash = '#home', options = {}) {
  const targetId = getSectionId(hash)
  const selector = targetId ? `#${targetId}` : 'main'
  const target = document.querySelector(selector)

  if (!target) return false

  // Use native scrollIntoView! The CSS scroll-margin-top handles the fixed header offset natively.
  target.scrollIntoView({
    behavior: options.behavior || 'smooth',
    block: 'start'
  })

  return true
}

export function scrollToSectionWithRetry(hash = '#home', options = {}) {
  const {
    behavior = 'smooth',
    offset = 24,
    timeoutMs = 5000
  } = options

  return new Promise((resolve) => {
    // First try immediately
    const ok = scrollToSection(hash, { behavior, offset })
    if (ok) return resolve(true)

    const targetId = getSectionId(hash)
    const selector = targetId ? `#${targetId}` : 'main'

    // Set up MutationObserver to watch for the target element to mount
    const observer = new MutationObserver(() => {
      const target = document.querySelector(selector)
      if (target) {
        observer.disconnect()
        clearTimeout(timeoutId)
        // Scroll once the layout has settled (50ms gives React time to paint)
        setTimeout(() => {
          scrollToSection(hash, { behavior, offset })
        }, 50)
        resolve(true)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Fail-safe timeout in case the section does not exist on this route
    const timeoutId = setTimeout(() => {
      observer.disconnect()
      resolve(false)
    }, timeoutMs)
  })
}
