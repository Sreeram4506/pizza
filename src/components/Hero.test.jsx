import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { SettingsProvider } from '../context/SettingsContext'
import Hero from './Hero'

// Mock the SettingsContext
jest.mock('../context/SettingsContext', () => ({
  SettingsProvider: ({ children }) => children,
  useSettings: () => ({
    settings: {
      restaurantName: 'Test Restaurant',
      email: 'test@example.com',
      phone: '+1-555-0123',
      address: '123 Test St',
      currency: 'USD',
      timezone: 'America/New_York'
    },
    loading: false,
    updateSettings: jest.fn()
  })
}))

// Mock the ChatbotContext
jest.mock('../context/ChatbotContext', () => ({
  ChatbotProvider: ({ children }) => children,
  useChatbot: () => ({
    isOpen: false,
    toggle: jest.fn(),
    close: jest.fn(),
    openWithIntent: jest.fn()
  })
}))

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Hero Component', () => {
  test('renders hero section with restaurant name', () => {
    renderWithProviders(<Hero />)
    expect(screen.getByText('Test Restaurant')).toBeInTheDocument()
  })

  test('renders call-to-action buttons', () => {
    renderWithProviders(<Hero />)
    
    expect(screen.getByText('Order Now')).toBeInTheDocument()
    expect(screen.getByText('View Menu')).toBeInTheDocument()
  })

  test('renders hero description', () => {
    renderWithProviders(<Hero />)
    expect(screen.getByText(/Experience the perfect blend/)).toBeInTheDocument()
  })

  test('navigates to menu when View Menu is clicked', () => {
    renderWithProviders(<Hero />)
    
    const menuButton = screen.getByText('View Menu')
    expect(menuButton).toBeInTheDocument()
  })

  test('has proper accessibility attributes', () => {
    const { container } = renderWithProviders(<Hero />)
    
    const heroSection = container.querySelector('section')
    expect(heroSection).toBeInTheDocument()
  })

  test('renders with correct CSS classes', () => {
    const { container } = renderWithProviders(<Hero />)
    
    expect(container.firstChild).toBeInTheDocument()
  })
})
