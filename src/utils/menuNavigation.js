export function openMenuRoute(navigate, closeChatbot = null) {
  if (typeof closeChatbot === 'function') {
    closeChatbot(false)
  }

  navigate('/menu')
}

export function closeMenuRoute(navigate, closeChatbot = null) {
  if (typeof closeChatbot === 'function') {
    closeChatbot(false)
  }

  navigate('/')
}
