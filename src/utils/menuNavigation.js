export function openMenuRoute(navigate, closeChatbot = null) {
  if (typeof closeChatbot === 'function') {
    closeChatbot(false)
  }

  navigate('/menu', { replace: false })
  window.scrollTo({ top: 0, behavior: 'auto' })
}

export function closeMenuRoute(navigate, closeChatbot = null) {
  // Always navigate home; chatbot close is best-effort only.
  try {
    if (typeof closeChatbot === 'function') {
      closeChatbot(false)
    }
  } catch (e) {
    // ignore
  }

  navigate('/')
}
