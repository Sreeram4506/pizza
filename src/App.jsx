import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { scrollToSectionWithRetry } from './utils/sectionNavigation'
import { Toaster } from 'react-hot-toast'
import { ChatbotProvider, useChatbot } from './context/ChatbotContext'
import { SettingsProvider } from './context/SettingsContext'
import { useQuickLoginTrigger } from './hooks/useQuickLoginTrigger'
import QuickLoginModal from './components/QuickLoginModal'
import Navbar from './components/Navbar'
import BannerDisplay from './components/BannerDisplay'
import Hero from './components/Hero'
import MarqueeStrip from './components/MarqueeStrip'
import About from './components/About'
import PizzaGallery from './components/PizzaGallery'
import ComboDeals from './components/ComboDeals'
import Testimonials from './components/Testimonials'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Chatbot from './components/Chatbot'
import CartDrawer from './components/CartDrawer'

const OrderTracker = lazy(() => import('./components/OrderTracker'))
const CustomerProfile = lazy(() => import('./components/CustomerProfile'))
const CustomerLogin = lazy(() => import('./components/CustomerLogin'))
const DeliveryPortal = lazy(() => import('./components/DeliveryPortal'))
const CustomerRegister = lazy(() => import('./components/CustomerRegister'))
const DiningPage = lazy(() => import('./components/DiningPage'))
const CateringPage = lazy(() => import('./components/CateringPage'))
const LegalPage = lazy(() => import('./components/LegalPage'))
const AdminLogin = lazy(() => import('./components/AdminLogin'))
const AdminLayout = lazy(() => import('./components/admin/Layout'))
const Dashboard = lazy(() => import('./components/admin/Dashboard'))
const MenuManager = lazy(() => import('./components/admin/MenuManager'))
const OrderManager = lazy(() => import('./components/admin/OrderManager'))
const CustomerManager = lazy(() => import('./components/admin/CustomerManager'))
const AnalyticsDashboard = lazy(() => import('./components/admin/Analytics'))
const Marketing = lazy(() => import('./components/admin/Marketing'))
const LoyaltyManager = lazy(() => import('./components/admin/LoyaltyManager'))
const Settings = lazy(() => import('./components/admin/Settings'))
const CustomPizzaBuilder = lazy(() => import('./components/CustomPizzaBuilder'))
const MenuPage = lazy(() => import('./components/MenuPage'))
import { resolveApiUrl } from './utils/env'

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

function ScrollToHash() {
  const location = useLocation()

  useEffect(() => {
    if (!location.hash) {
      // If we navigate to a new page without a hash, scroll to top
      window.scrollTo(0, 0)
      return
    }
    // Defer scroll by one animation frame to let the route finish painting
    const raf = requestAnimationFrame(() => {
      scrollToSectionWithRetry(location.hash, { behavior: 'smooth', offset: 24 })
    })
    return () => cancelAnimationFrame(raf)
  }, [location.hash, location.pathname])

  return null
}

function CloseChatbotOnRouteChange() {
  const location = useLocation()
  const { setIsOpen, setIsCartDrawerOpen } = useChatbot()

  useEffect(() => {
    if (typeof setIsOpen === 'function') setIsOpen(false)
  }, [location.pathname, location.hash, setIsOpen])

  return null
}

function CartDrawerWrapper() {
  const { isCartDrawerOpen, setIsCartDrawerOpen } = useChatbot()

  return <CartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} />
}

function Home() {
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
        <Suspense fallback={
          <div id="atelier" className="py-24 lg:py-32 min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
            <div className="text-[#1A1410]/60 font-body">Loading Atelier...</div>
          </div>
        }>
          <CustomPizzaBuilder />
        </Suspense>
        <About />
        <ComboDeals />
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
  // Auto-wake Render backend
  useEffect(() => {
    const wakeServer = () => {
      fetch(resolveApiUrl('/api/health'), { cache: 'no-store' }).catch(() => { })
    }

    wakeServer()
    const timer = setTimeout(wakeServer, 2000)

    return () => clearTimeout(timer)
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
              <ScrollToHash />
              <CloseChatbotOnRouteChange />
              <CartDrawerWrapper />

              <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F7F1EA] text-[#231B16] font-body">Loading Pizza Blast...</div>}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/menu" element={<><MenuPage /><Chatbot /></>} />

                  <Route path="/login" element={<><Navbar /><CustomerLogin /><Chatbot /></>} />
                  <Route path="/register" element={<><Navbar /><CustomerRegister /><Chatbot /></>} />
                  <Route path="/track" element={<><Navbar /><OrderTracker /><Chatbot /></>} />
                  <Route path="/profile" element={<><Navbar /><CustomerProfile /><Chatbot /></>} />
                  <Route path="/dining" element={<><Navbar /><DiningPage /><Footer /><Chatbot /></>} />
                  <Route path="/catering" element={<><Navbar /><CateringPage /><Footer /><Chatbot /></>} />
                  <Route path="/legal/privacy" element={<><Navbar /><LegalPage variant="privacy" /><Footer /></>} />
                  <Route path="/legal/terms" element={<><Navbar /><LegalPage variant="terms" /><Footer /></>} />
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
              </Suspense>
            </div>
          </div>
        </ChatbotProvider>
      </SettingsProvider>
    </BrowserRouter>
  )
}

export default App
