import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ChatbotProvider } from './context/ChatbotContext'
import { SettingsProvider } from './context/SettingsContext'
import { useQuickLoginTrigger } from './hooks/useQuickLoginTrigger'
import QuickLoginModal from './components/QuickLoginModal'
import Navbar from './components/Navbar'
import BannerDisplay from './components/BannerDisplay'
import Hero from './components/Hero'
import About from './components/About'
import PizzaGallery from './components/PizzaGallery'
import ComboDeals from './components/ComboDeals'
import Testimonials from './components/Testimonials'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Chatbot from './components/Chatbot'
import OrderNotifications from './components/OrderNotifications'
import OrderTracker from './components/OrderTracker'
import CustomerLogin from './components/CustomerLogin'
import CustomerRegister from './components/CustomerRegister'
import AdminLogin from './components/AdminLogin'
import AdminLayout from './components/admin/Layout'
import Dashboard from './components/admin/Dashboard'
import MenuManager from './components/admin/MenuManager'
import OrderManager from './components/admin/OrderManager'
import CustomerManager from './components/admin/CustomerManager'
import AnalyticsDashboard from './components/admin/Analytics'
import Marketing from './components/admin/Marketing'
import Settings from './components/admin/Settings'
import CustomPizzaBuilder from './components/CustomPizzaBuilder'

// Routes where quick login should NOT appear
const EXCLUDED_ROUTES = [
  '/login',
  '/register', 
  '/admin',
  '/admin/login'
]

// Component to handle quick login popup
function QuickLoginWrapper() {
  const location = useLocation()
  const { shouldShowPopup, dismissPopup, onLoginSuccess } = useQuickLoginTrigger()
  
  // Check if current route is excluded
  const isExcludedRoute = EXCLUDED_ROUTES.some(route => 
    location.pathname.startsWith(route)
  )
  
  // Also check if user is already logged in
  const isLoggedIn = !!localStorage.getItem('token')
  
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
  return (
    <>
      <Navbar />
      <OrderNotifications />
      <main>
        <Hero />
        <BannerDisplay position="middle" />
        <About />
        <PizzaGallery />
        <ComboDeals />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
      <Chatbot />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <ChatbotProvider>
          <div className="min-h-screen bg-mozzarella-100 relative overflow-x-hidden selection:bg-tomato-200 selection:text-wood-800">
            <div className="relative z-10 text-slate-900">
              <QuickLoginWrapper />
              
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<CustomerLogin />} />
                <Route path="/register" element={<CustomerRegister />} />
                <Route path="/track" element={<OrderTracker />} />
                <Route path="/custom-pizza" element={<CustomPizzaBuilder />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminLayout><Dashboard /></AdminLayout>} />
                <Route path="/admin/dashboard" element={<AdminLayout><Dashboard /></AdminLayout>} />
                <Route path="/admin/menu" element={<AdminLayout><MenuManager /></AdminLayout>} />
                <Route path="/admin/orders" element={<AdminLayout><OrderManager /></AdminLayout>} />
                <Route path="/admin/customers" element={<AdminLayout><CustomerManager /></AdminLayout>} />
                <Route path="/admin/loyalty" element={<AdminLayout><CustomerManager /></AdminLayout>} />
                <Route path="/admin/analytics" element={<AdminLayout><AnalyticsDashboard /></AdminLayout>} />
                <Route path="/admin/marketing" element={<AdminLayout><Marketing /></AdminLayout>} />
                <Route path="/admin/settings" element={<AdminLayout><Settings /></AdminLayout>} />
              </Routes>
            </div>
          </div>
        </ChatbotProvider>
      </SettingsProvider>
    </BrowserRouter>
  )
}


export default App
