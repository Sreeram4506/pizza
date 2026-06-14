import { describe, expect, it, jest } from '@jest/globals'
import { closeMenuRoute, openMenuRoute } from './menuNavigation'

describe('menu navigation helpers', () => {
  it('opens the real menu route and closes the chatbot panel', () => {
    const navigate = jest.fn()
    const closeChatbot = jest.fn()

    openMenuRoute(navigate, closeChatbot)

    expect(closeChatbot).toHaveBeenCalledWith(false)
    expect(navigate).toHaveBeenCalledWith('/menu', { replace: false })
  })

  it('returns to the home page and closes the chatbot panel', () => {
    const navigate = jest.fn()
    const closeChatbot = jest.fn()

    closeMenuRoute(navigate, closeChatbot)

    expect(closeChatbot).toHaveBeenCalledWith(false)
    expect(navigate).toHaveBeenCalledWith('/')
  })
})
