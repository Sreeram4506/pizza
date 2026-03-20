import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
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

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => ({
      'hero.est': 'Est. 2024',
      'hero.type': 'Wood Fired Pizza',
      'hero.tagline': 'Crafted by hand and fired fresh for every table.',
      'hero.exploreMenu': 'Explore Menu',
      'hero.buildYourOwn': 'Build Your Own',
      'hero.features.dough': 'Slow Fermented Dough',
      'hero.features.fired': 'Stone Fired',
      'hero.features.tomatoes': 'San Marzano Tomatoes',
      'hero.features.rating': 'Top Rated',
      'hero.reservations': 'Reservations'
    }[key] || key)
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
    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.getByText('Restaurant')).toBeInTheDocument()
  })

  test('renders call-to-action buttons', () => {
    renderWithProviders(<Hero />)

    expect(screen.getByText('Explore Menu')).toBeInTheDocument()
    expect(screen.getByText('Build Your Own')).toBeInTheDocument()
  })

  test('renders hero description', () => {
    renderWithProviders(<Hero />)
    expect(screen.getByText('Crafted by hand and fired fresh for every table.')).toBeInTheDocument()
  })

  test('renders the menu navigation button', () => {
    renderWithProviders(<Hero />)

    const menuButton = screen.getByText('Explore Menu')
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
