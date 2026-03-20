import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()
  const { settings } = useSettings()
  const navigate = useNavigate()

  const navLinks = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.menu'), href: '/menu' },
    { name: t('footer.orderOnline'), href: '/menu' },
    { name: t('footer.customPizza'), href: '/#atelier' },
    { name: t('nav.trackOrder'), href: '/track' }
  ]

  const handleLinkClick = (e, href) => {
    e.preventDefault()
    if (href.startsWith('/#')) {
      const id = href.substring(2)
      if (window.location.pathname === '/') {
        const element = document.getElementById(id)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      } else {
        navigate(href)
      }
    } else {
      navigate(href)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <footer className="bg-[#1A1410] relative overflow-hidden section-grain">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[-10rem] top-[-6rem] h-[24rem] w-[24rem] rounded-full bg-white/5 blur-[120px]" />
        <div className="absolute right-[-10rem] bottom-[-10rem] h-[26rem] w-[26rem] rounded-full bg-gold-400/10 blur-[140px]" />
      </div>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">

        <div className="py-16 lg:py-24">
          <h2 className="font-serif-1947 italic text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[120px] text-white/[0.06] leading-none tracking-tight select-none text-center">
            {settings?.restaurantName || 'Mustang Pizza'}
          </h2>
        </div>

        <div className="glass-section-divider" />

        {/* 4 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-16">
          <div className="glass-panel-dark rounded-[2rem] p-6">
            <h4 className="font-mono text-[9px] tracking-[0.25em] uppercase text-gold-400 mb-6">{t('footer.navigateLabel')}</h4>
            <ul className="space-y-4">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="text-white/50 text-sm font-body hover:text-white transition-colors"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel-dark rounded-[2rem] p-6">
            <h4 className="font-mono text-[9px] tracking-[0.25em] uppercase text-gold-400 mb-6">{t('footer.hoursLabel')}</h4>
            <ul className="space-y-4">
              <li className="text-white/50 text-sm font-body">{t('footer.hours.monFri')}</li>
              <li className="text-white/50 text-sm font-body">{t('footer.hours.sat')}</li>
              <li className="text-white/50 text-sm font-body">{t('footer.hours.sun')}</li>
              <li className="text-white text-sm font-body font-medium mt-4">{t('footer.acceptingOrders')}</li>
            </ul>
          </div>

          <div className="glass-panel-dark rounded-[2rem] p-6">
            <h4 className="font-mono text-[9px] tracking-[0.25em] uppercase text-gold-400 mb-6">{t('footer.locationLabel')}</h4>
            <p className="text-white/50 text-sm font-body leading-relaxed mb-4">
              {settings?.address || 'Visit us at our main location'}
            </p>
            <button
              onClick={() => navigate('/#contact')}
              className="text-white text-sm font-body hover:text-ember-500 transition-colors"
            >
              {t('footer.getDirections')}
            </button>
          </div>

          <div className="glass-panel-dark rounded-[2rem] p-6">
            <h4 className="font-mono text-[9px] tracking-[0.25em] uppercase text-gold-400 mb-6">{t('footer.followLabel')}</h4>
            <ul className="space-y-4">
              {['Instagram', 'Facebook', 'Twitter', 'TikTok'].map((social) => (
                <li key={social}>
                  <a href="#" className="text-white/50 text-sm font-body hover:text-white transition-colors">
                    {social}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-[10px] font-black uppercase tracking-widest leading-none">
            © {currentYear} {settings?.restaurantName || 'Mustang Pizza'} — {t('footer.rightsReserved')}
          </p>
          <div className="flex items-center gap-6 text-xs font-body">
            <button className="text-white/30 hover:text-white/60 transition-colors">{t('footer.privacy')}</button>
            <button className="text-white/30 hover:text-white/60 transition-colors">{t('footer.terms')}</button>
            <span className="text-white/20">{t('footer.madeBy')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
