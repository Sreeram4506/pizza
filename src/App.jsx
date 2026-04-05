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
import About from './components/About'
import PizzaGallery from './components/PizzaGallery'
import Testimonials from './components/Testimonials'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Chatbot from './components/Chatbot'
import CartDrawer from './components/CartDrawer'
import DeliveryTrackingBar from './components/DeliveryTrackingBar'
import OrderNotifications from './components/OrderNotifications'
import { useTranslation } from 'react-i18next'
import CateringPage from './components/CateringPage'
import GlobalModals from './components/GlobalModals'
import DiningPage from './components/DiningPage'
import CheckoutPage from './components/CheckoutPage'

import OrderTracker from './components/OrderTracker'
import CustomerProfile from './components/CustomerProfile'
import CustomerLogin from './components/CustomerLogin'
import DeliveryPortal from './components/DeliveryPortal'
import CustomerRegister from './components/CustomerRegister'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import AdminLogin from './components/AdminLogin'
import AdminLayout from './components/admin/Layout'
import Dashboard from './components/admin/Dashboard'
import MenuManager from './components/admin/MenuManager'
import OrderManager from './components/admin/OrderManager'
import CustomerManager from './components/admin/CustomerManager'
import AnalyticsDashboard from './components/admin/Analytics'
import Marketing from './components/admin/Marketing'
import CateringManager from './components/admin/CateringManager'
import ReservationManager from './components/admin/ReservationManager'
import LoyaltyManager from './components/admin/LoyaltyManager'
import Settings from './components/admin/Settings'
import CustomPizzaBuilder from './components/CustomPizzaBuilder'
import MenuPage from './components/MenuPage'
import LegalPage from './components/LegalPage'

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

function GlobalChatbot() {
  const location = useLocation()
  const hiddenPrefixes = ['/admin', '/delivery']
  const shouldHide = hiddenPrefixes.some(prefix =>
    location.pathname === prefix || location.pathname.startsWith(`${prefix}/`)
  )

  if (shouldHide) return null

  return <Chatbot />
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
        <BannerDisplay position="middle" />
        <PizzaGallery />
        <CustomPizzaBuilder />
        <About />
        <Testimonials />
        <Contact />
        <BannerDisplay position="bottom" />
        <Footer />
      </main>
    </>
  )
}

function App() {
  const { i18n } = useTranslation()

  // Sync direction attribute with current language
  useEffect(() => {
    const rtlLanguages = ['ar', 'ur']
    const dir = rtlLanguages.includes(i18n.language) ? 'rtl' : 'ltr'
    document.documentElement.dir = dir
    document.documentElement.lang = i18n.language
  }, [i18n.language])

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
          <div className="bg-[#FAFAF8] relative min-h-screen text-[#1A1410] font-sans selection:bg-[#1A1410] selection:text-white pb-0">
            <div className="relative z-10">
              <Toaster position="top-center" toastOptions={{
                className: 'font-semibold shadow-md border border-[#EBEBE6]',
                style: {
                  background: '#FFFFFF',
                  color: '#1A1410',
                  borderRadius: '16px',
                  padding: '12px 24px',
                }
              }} />
              <QuickLoginWrapper />

              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/checkout" element={<><Navbar /><CheckoutPage /></>} />
                <Route path="/catering" element={<><Navbar /><CateringPage /></>} />
                <Route path="/dining" element={<><Navbar /><DiningPage /></>} />

                <Route path="/login" element={<><Navbar /><CustomerLogin /></>} />
                <Route path="/register" element={<><Navbar /><CustomerRegister /></>} />
                <Route path="/forgot-password" element={<><Navbar /><ForgotPassword /></>} />
                <Route path="/reset-password" element={<><Navbar /><ResetPassword /></>} />
                <Route path="/track" element={<><Navbar /><OrderTracker /></>} />
                <Route path="/track/:orderNumber" element={<><Navbar /><OrderTracker /></>} />
                <Route path="/privacy" element={<><Navbar /><LegalPage variant="privacy" /><Footer /></>} />
                <Route path="/terms" element={<><Navbar /><LegalPage variant="terms" /><Footer /></>} />
                <Route path="/profile" element={<CustomerProfile />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/delivery" element={<DeliveryPortal />} />
                <Route path="/delivery/:token" element={<DeliveryPortal />} />

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
                  <Route path="catering" element={<CateringManager />} />
                  <Route path="reservations" element={<ReservationManager />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <GlobalChatbot />
              <CartDrawer />
              <GlobalModals />
              <DeliveryTrackingBar />
              <OrderNotifications />
            </div>
          </div>
        </ChatbotProvider>
      </SettingsProvider>
    </BrowserRouter>
  )
}

export default App
