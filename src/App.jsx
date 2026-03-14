import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ChatbotProvider } from './context/ChatbotContext'
import { SettingsProvider } from './context/SettingsContext'
import { useQuickLoginTrigger } from './hooks/useQuickLoginTrigger'
import QuickLoginModal from './components/QuickLoginModal'
import Navbar from './components/Navbar'
import BannerDisplay from './components/BannerDisplay'
import Hero from './components/Hero'
import MarqueeStrip from './components/MarqueeStrip'
import About from './components/About'
import PizzaGallery from './components/PizzaGallery'
import Testimonials from './components/Testimonials'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Chatbot from './components/Chatbot'

import OrderTracker from './components/OrderTracker'
import CustomerProfile from './components/CustomerProfile'
import CustomerLogin from './components/CustomerLogin'
import DeliveryPortal from './components/DeliveryPortal'
import CustomerRegister from './components/CustomerRegister'
import AdminLogin from './components/AdminLogin'
import AdminLayout from './components/admin/Layout'
import Dashboard from './components/admin/Dashboard'
import MenuManager from './components/admin/MenuManager'
import OrderManager from './components/admin/OrderManager'
import CustomerManager from './components/admin/CustomerManager'
import AnalyticsDashboard from './components/admin/Analytics'
import Marketing from './components/admin/Marketing'
import LoyaltyManager from './components/admin/LoyaltyManager'
import Settings from './components/admin/Settings'
import CustomPizzaBuilder from './components/CustomPizzaBuilder'
import MenuPage from './components/MenuPage'

// Routes where quick login should NOT appear
const EXCLUDED_ROUTES = [
  '/login',
  '/register',
  '/admin',
  '/admin/login',
  '/delivery',
  '/menu'
]

// Component to handle quick login popup
function QuickLoginWrapper() {
  const location = useLocation()
  const { shouldShowPopup, dismissPopup, onLoginSuccess } = useQuickLoginTrigger()

  const isExcludedRoute = EXCLUDED_ROUTES.some(route =>
    location.pathname.startsWith(route)
  )
  const isLoggedIn = !!localStorage.getItem('customerToken')
  const shouldShow = shouldShowPopup && !isExcludedRoute && !isLoggedIn

  return (
    <QuickLoginModal
      isOpen={shouldShow}
      onClose={dismissPopup}
      onLoginSuccess={onLoginSuccess}
    />
  )
}

function Home() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        // Wait a bit for the page to render fully
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [hash]);

  return (
    <>
      <Navbar />
      {/* Grain texture overlay */}
      <div className="grain-overlay" />

      <main>
        <Hero />
        <MarqueeStrip />
        <BannerDisplay position="middle" />
        <PizzaGallery />
        <CustomPizzaBuilder />
        <About />
        <Testimonials />
        <Contact />
      </main>
      <BannerDisplay position="bottom" />
      <Footer />
      <Chatbot />
    </>
  )
}

function App() {
  // Ensure backend is reachable (optional local check)
  useEffect(() => {
    const checkServer = () => {
      fetch('/health').catch(() => { })
    }

    checkServer()
  }, [])

  return (
    <BrowserRouter>
      <SettingsProvider>
        <ChatbotProvider>
          <div className="min-h-screen bg-[#FAFAF8] relative overflow-x-hidden selection:bg-ember-500/15 selection:text-[#1A1410]">
            <div className="relative z-10 text-[#1A1410]">
              <Toaster position="top-center" toastOptions={{
                className: 'font-body',
                style: {
                  background: '#1A1410',
                  color: '#fff',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }
              }} />
              <QuickLoginWrapper />

              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<><MenuPage /><Chatbot /></>} />

                <Route path="/login" element={<><Navbar /><CustomerLogin /><Chatbot /></>} />
                <Route path="/register" element={<><Navbar /><CustomerRegister /><Chatbot /></>} />
                <Route path="/track" element={<><Navbar /><OrderTracker /><Chatbot /></>} />
                <Route path="/profile" element={<><Navbar /><CustomerProfile /><Chatbot /></>} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/delivery" element={<DeliveryPortal />} />

                {/* Secure Nested Admin Routes — no chatbot, no grain */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="menu" element={<MenuManager />} />
                  <Route path="orders" element={<OrderManager />} />
                  <Route path="customers" element={<CustomerManager />} />
                  <Route path="loyalty" element={<LoyaltyManager />} />
                  <Route path="analytics" element={<AnalyticsDashboard />} />
                  <Route path="marketing" element={<Marketing />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </ChatbotProvider>
      </SettingsProvider>
    </BrowserRouter>
  )
}

export default App
