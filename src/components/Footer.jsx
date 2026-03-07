import { useSettings } from '../context/SettingsContext'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const { settings } = useSettings()

  return (
    <footer className="bg-[#1A1410] relative overflow-hidden section-grain">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">

        <div className="py-16 lg:py-24">
          <h2 className="font-display italic text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[120px] text-white/[0.06] leading-none tracking-tight select-none text-center">
            {settings?.restaurantName || 'PizzaBlast'}
          </h2>
        </div>

        <div className="divider-gold" />

        {/* 4 Columns */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 py-16">
          <div>
            <h4 className="font-mono text-[9px] tracking-[0.25em] uppercase text-gold-400 mb-6">Navigate</h4>
            <ul className="space-y-4">
              {['Home', 'Menu', 'Order Online', 'Custom Pizza', 'Track Order'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-white/50 text-sm font-body hover:text-white transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[9px] tracking-[0.25em] uppercase text-gold-400 mb-6">Hours</h4>
            <ul className="space-y-4">
              <li className="text-white/50 text-sm font-body">Mon – Fri: 10am – 11pm</li>
              <li className="text-white/50 text-sm font-body">Saturday: 10am – 12am</li>
              <li className="text-white/50 text-sm font-body">Sunday: 11am – 10pm</li>
              <li className="text-white text-sm font-body font-medium mt-4">Now Accepting Orders</li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[9px] tracking-[0.25em] uppercase text-gold-400 mb-6">Location</h4>
            <p className="text-white/50 text-sm font-body leading-relaxed mb-4">
              {settings?.address?.split(',')[0] || '123 Pizza Plaza'}<br />
              {settings?.address?.split(',').slice(1).join(',') || 'New York, NY 10001'}
            </p>
            <a href="#" className="text-white text-sm font-body hover:text-ember-500 transition-colors">
              Get Directions →
            </a>
          </div>

          <div>
            <h4 className="font-mono text-[9px] tracking-[0.25em] uppercase text-gold-400 mb-6">Follow</h4>
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
          <p className="text-white/30 text-xs font-body">
            © {currentYear} {settings?.restaurantName || 'PizzaBlast'} — All rights reserved
          </p>
          <div className="flex items-center gap-6 text-xs font-body">
            <a href="#" className="text-white/30 hover:text-white/60 transition-colors">Privacy</a>
            <a href="#" className="text-white/30 hover:text-white/60 transition-colors">Terms</a>
            <span className="text-white/20">Made with ♥ in New York</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
